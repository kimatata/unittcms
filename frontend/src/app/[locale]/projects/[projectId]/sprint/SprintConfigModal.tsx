'use client';
import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@heroui/react';
import { addToast } from '@heroui/react';
import { SprintConfig, SprintMessages } from '@/types/project';
import { saveSprintConfig } from '@/utils/sprintControl';
import { logError } from '@/utils/errorHandler';

type DeploymentFlow = 'gitflow' | 'github-flow' | 'trunk' | 'custom';

const FLOW_KEY_BRANCHES: Record<DeploymentFlow, string[]> = {
  gitflow: ['main', 'master', 'develop', 'release/*', 'hotfix/*'],
  'github-flow': ['main', 'master'],
  trunk: ['main', 'master', 'trunk'],
  custom: [],
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  config: SprintConfig | null;
  onSaved: (config: SprintConfig) => void;
  jwt: string;
  messages: SprintMessages;
};

export default function SprintConfigModal({ isOpen, onClose, config, onSaved, jwt, messages }: Props) {
  const [flow, setFlow] = useState<DeploymentFlow>('gitflow');
  const [sourceBranch, setSourceBranch] = useState('');
  const [keyBranches, setKeyBranches] = useState('');
  const [ticketRegex, setTicketRegex] = useState('([A-Z]+-[0-9]+)');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!config || !isOpen) return;
    setFlow((config.deploymentFlow as DeploymentFlow) || 'gitflow');
    setSourceBranch(config.sourceBranch || '');
    setKeyBranches(config.keyBranchPatterns.join(', '));
    setTicketRegex(config.branchTicketRegex || '([A-Z]+-[0-9]+)');
  }, [config, isOpen]);

  const handleFlowChange = (newFlow: DeploymentFlow) => {
    setFlow(newFlow);
    setKeyBranches(FLOW_KEY_BRANCHES[newFlow].join(', '));
  };

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const updated = await saveSprintConfig(jwt, {
        ...config,
        deploymentFlow: flow,
        sourceBranch: sourceBranch.trim() || null,
        keyBranchPatterns: keyBranches.split(',').map((s) => s.trim()).filter(Boolean),
        branchTicketRegex: ticketRegex.trim() || '([A-Z]+-[0-9]+)',
      });
      onSaved(updated);
      addToast({ title: messages.configSaved, color: 'success' });
      onClose();
    } catch (err) {
      logError('SprintConfigModal save', err);
      addToast({ title: 'Failed to save configuration', color: 'danger' });
    } finally {
      setIsSaving(false);
    }
  };

  const flowOptions: { id: DeploymentFlow; label: string; desc: string }[] = [
    { id: 'gitflow', label: messages.flowGitflow, desc: messages.flowGitflowDesc },
    { id: 'github-flow', label: messages.flowGithubFlow, desc: messages.flowGithubFlowDesc },
    { id: 'trunk', label: messages.flowTrunk, desc: messages.flowTrunkDesc },
    { id: 'custom', label: messages.flowCustom, desc: messages.flowCustomDesc },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>{messages.detectionSettings}</ModalHeader>
        <ModalBody className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-medium mb-2">{messages.deploymentFlowLabel}</p>
            <div className="grid grid-cols-2 gap-2">
              {flowOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleFlowChange(opt.id)}
                  className={`text-left p-3 rounded-lg border-2 transition-colors ${
                    flow === opt.id
                      ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                      : 'border-default-200 hover:border-default-400'
                  }`}
                >
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-default-400 mt-0.5 font-mono">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <Input
            label={messages.sourceBranchLabel}
            placeholder={messages.sourceBranchPlaceholder}
            value={sourceBranch}
            onValueChange={setSourceBranch}
            variant="bordered"
            description={messages.sourceBranchDesc}
          />

          <Input
            label={messages.keyBranchPatterns}
            placeholder="main, master, develop, release/*"
            value={keyBranches}
            onValueChange={setKeyBranches}
            variant="bordered"
            description={messages.keyBranchPatternsDesc}
          />

          <Input
            label={messages.branchTicketRegex}
            placeholder="([A-Z]+-[0-9]+)"
            value={ticketRegex}
            onValueChange={setTicketRegex}
            variant="bordered"
            description={messages.branchTicketRegexDesc}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>{messages.cancel}</Button>
          <Button
            color="primary"
            isLoading={isSaving}
            isDisabled={isSaving}
            onPress={handleSave}
          >
            {isSaving ? messages.savingFlowSetup : messages.saveConfig}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
