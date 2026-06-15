'use client';
import { useState, useEffect, useContext, useCallback } from 'react';
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { addToast } from '@heroui/react';
import { RefreshCw, Plus, X, LayoutDashboard, GitBranch, AlertCircle, Settings } from 'lucide-react';
import { TokenContext } from '@/utils/TokenProvider';
import { SprintMessages, SprintFlow, SprintBranchInfo, SprintDraftFolder, SprintDetectResult, SprintConfig, SprintFlowStatus } from '@/types/project';
import { fetchAutomationConfig } from '@/utils/automationConfigControl';
import {
  detectSprintBranches,
  startSprintFlow,
  fetchSprintFlows,
  fetchSprintFlow,
  saveNodePositions,
  fetchSprintConfig,
  saveSprintConfig,
} from '@/utils/sprintControl';
import { logError } from '@/utils/errorHandler';
import SprintBoard from './SprintBoard';
import DetailPanel from './detail/DetailPanel';
import SprintConfigModal from './SprintConfigModal';

type Props = {
  projectId: string;
  messages: SprintMessages;
};

type DeploymentFlow = 'gitflow' | 'github-flow' | 'trunk' | 'custom';

const FLOW_SOURCE_BRANCH: Record<DeploymentFlow, string> = {
  gitflow: 'develop',
  'github-flow': 'main',
  trunk: 'main',
  custom: '',
};

const FLOW_KEY_BRANCHES: Record<DeploymentFlow, string[]> = {
  gitflow: ['main', 'master', 'develop', 'release/*', 'hotfix/*'],
  'github-flow': ['main', 'master'],
  trunk: ['main', 'master', 'trunk'],
  custom: ['main', 'master', 'develop'],
};

const STATUS_COLORS: Record<SprintFlowStatus, string> = {
  active: 'bg-success-500',
  draft: 'bg-warning-500',
  testing: 'bg-primary-500',
  done: 'bg-default-400',
  archived: 'bg-default-300',
};

const STATUS_ROW_COLORS: Record<SprintFlowStatus, string> = {
  active: 'border-l-success-500',
  draft: 'border-l-warning-500',
  testing: 'border-l-primary-500',
  done: 'border-l-default-300',
  archived: 'border-l-default-200',
};

function statusLabel(status: SprintFlowStatus, messages: SprintMessages): string {
  const map: Record<SprintFlowStatus, string> = {
    active: messages.statusActive,
    draft: messages.statusDraft,
    testing: messages.statusTesting,
    done: messages.statusDone,
    archived: messages.statusArchived,
  };
  return map[status] ?? status;
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function SprintPage({ projectId, messages }: Props) {
  const context = useContext(TokenContext);
  const jwt = context.token.access_token;

  const [automationConfigId, setAutomationConfigId] = useState<number | null>(null);
  const [hasSourceRepo, setHasSourceRepo] = useState(false);
  const [sprintConfig, setSprintConfig] = useState<SprintConfig | null>(null);
  const [flows, setFlows] = useState<SprintFlow[]>([]);
  const [activeFlow, setActiveFlow] = useState<SprintFlow | null>(null);
  const [detection, setDetection] = useState<SprintDetectResult | null>(null);
  const [isDetectionDismissed, setIsDetectionDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  // Start sprint modal
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBaseBranch, setNewBaseBranch] = useState('');
  const [newVersionBranch, setNewVersionBranch] = useState('');

  // Board interaction
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<'branch' | 'version' | 'testPlan' | 'generate' | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<SprintBranchInfo | null>(null);
  const [draft, setDraft] = useState<SprintDraftFolder[]>([]);

  // Setup wizard
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [wizardFlow, setWizardFlow] = useState<DeploymentFlow>('gitflow');
  const [wizardSourceBranch, setWizardSourceBranch] = useState('develop');
  const [isSavingWizard, setIsSavingWizard] = useState(false);

  // Config modal
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const selectFlow = useCallback(async (flow: SprintFlow) => {
    if (activeFlow?.id === flow.id) return;
    setSelectedNodeId(null);
    setDetailMode(null);
    setSelectedBranch(null);
    try {
      const full = await fetchSprintFlow(jwt, flow.id);
      setActiveFlow(full);
      setDraft(full.testPlanDraft || []);
    } catch (err) {
      logError('SprintPage selectFlow', err);
    }
  }, [jwt, activeFlow?.id]);

  const loadAll = useCallback(async () => {
    if (!jwt) return;
    setIsLoading(true);
    try {
      const cfg = await fetchAutomationConfig(jwt, Number(projectId));
      if (!cfg) { setIsLoading(false); return; }
      setAutomationConfigId(cfg.id);
      const srcConfigured = !!(cfg.sourceRepoOwner && cfg.sourceRepoName);
      setHasSourceRepo(srcConfigured);

      const [flowList, sprintCfg] = await Promise.all([
        fetchSprintFlows(jwt, cfg.id),
        fetchSprintConfig(jwt, cfg.id),
      ]);

      setSprintConfig(sprintCfg);
      setFlows(flowList);

      if (srcConfigured && !sprintCfg.sourceBranch) {
        setIsWizardOpen(true);
      }

      // Auto-select the most recent active/draft/testing flow
      const inProgress = flowList.find((f) => f.status === 'active' || f.status === 'draft' || f.status === 'testing');
      const toLoad = inProgress || flowList[0] || null;
      if (toLoad) {
        const full = await fetchSprintFlow(jwt, toLoad.id);
        setActiveFlow(full);
        setDraft(full.testPlanDraft || []);
      }

      if (srcConfigured && sprintCfg.sourceBranch) {
        const det = await detectSprintBranches(jwt, cfg.id).catch(() => null);
        setDetection(det);
      }
    } catch (err) {
      logError('SprintPage loadAll', err);
    } finally {
      setIsLoading(false);
    }
  }, [jwt, projectId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleWizardFlowChange = (flow: DeploymentFlow) => {
    setWizardFlow(flow);
    setWizardSourceBranch(FLOW_SOURCE_BRANCH[flow]);
  };

  const handleWizardSave = async () => {
    if (!automationConfigId || !wizardSourceBranch.trim()) return;
    setIsSavingWizard(true);
    try {
      const saved = await saveSprintConfig(jwt, {
        automationConfigId,
        sourceBranch: wizardSourceBranch.trim(),
        deploymentFlow: wizardFlow,
        keyBranchPatterns: FLOW_KEY_BRANCHES[wizardFlow],
        sprintBranchPattern: null,
        jiraBaseUrl: null,
        jiraProjectKey: null,
        branchTicketRegex: '([A-Z]+-[0-9]+)',
      });
      setSprintConfig(saved);
      setIsWizardOpen(false);
      setWizardStep(1);

      const det = await detectSprintBranches(jwt, automationConfigId).catch(() => null);
      setDetection(det);
      setIsDetectionDismissed(false);

      if (det?.hasNewBranches) {
        addToast({
          title: `${det.newBranchCount} new feature branch${det.newBranchCount !== 1 ? 'es' : ''} detected`,
          description: 'Start a sprint flow to track them.',
          color: 'primary',
        });
      } else {
        addToast({ title: 'Sprint detection configured', color: 'success' });
      }
    } catch (err) {
      logError('SprintPage wizardSave', err);
      addToast({ title: 'Failed to save configuration', color: 'danger' });
    } finally {
      setIsSavingWizard(false);
    }
  };

  const openStartModal = () => {
    const defaultTitle = `Sprint — ${new Date().toLocaleDateString()}`;
    setNewTitle(defaultTitle);
    setNewBaseBranch(sprintConfig?.sourceBranch || 'main');
    setNewVersionBranch(detection?.detectedVersionBranch || '');
    setIsStartModalOpen(true);
  };

  const handleStartSprint = async () => {
    if (!automationConfigId || !newTitle.trim()) return;
    setIsStarting(true);
    try {
      const result = await startSprintFlow(
        jwt,
        automationConfigId,
        newTitle,
        newBaseBranch || sprintConfig?.sourceBranch || 'main',
        newVersionBranch || null
      );
      const full = await fetchSprintFlow(jwt, result.flow.id);
      setActiveFlow(full);
      setDraft(full.testPlanDraft || []);
      setFlows((prev) => [full, ...prev]);
      setIsStartModalOpen(false);
      addToast({ title: 'Sprint flow started', color: 'success' });
    } catch (err) {
      logError('SprintPage startSprint', err);
      addToast({ title: 'Failed to start sprint', color: 'danger' });
    } finally {
      setIsStarting(false);
    }
  };

  const handleNodeClick = (nodeId: string, nodeType: string) => {
    setSelectedNodeId(nodeId);
    if (nodeType === 'branch') {
      const branchName = nodeId.replace('branch-', '');
      const branch = activeFlow?.branchSnapshot.find((b) => b.name === branchName) || null;
      setSelectedBranch(branch);
      setDetailMode('branch');
    } else if (nodeType === 'version') {
      setDetailMode(draft.length > 0 ? 'testPlan' : 'version');
    } else if (nodeType === 'testPlan') {
      setDetailMode('testPlan');
    } else if (nodeType === 'ticket') {
      setDetailMode(null);
    }
  };

  const handleGenerateClick = () => {
    setSelectedNodeId('version-node');
    setDetailMode('generate');
  };

  const handleGenerationComplete = (folders: SprintDraftFolder[]) => {
    setDraft(folders);
    setDetailMode('testPlan');
    if (activeFlow) {
      setActiveFlow((prev) => prev ? { ...prev, status: 'draft', testPlanDraft: folders } : prev);
      setFlows((prev) => prev.map((f) => f.id === activeFlow.id ? { ...f, status: 'draft' } : f));
    }
    addToast({ title: `Test plan ready — ${folders.reduce((s, f) => s + f.cases.length, 0)} cases`, color: 'success' });
  };

  const handleApproved = (count: number) => {
    if (activeFlow) {
      setActiveFlow((prev) => prev ? { ...prev, status: 'testing' } : prev);
      setFlows((prev) => prev.map((f) => f.id === activeFlow.id ? { ...f, status: 'testing' } : f));
    }
    setDetailMode(null);
    addToast({ title: `${count} cases added to sprint test suite`, color: 'success' });
  };

  const handlePositionsChange = async (positions: Record<string, { x: number; y: number }>) => {
    if (!activeFlow) return;
    await saveNodePositions(jwt, activeFlow.id, positions).catch(() => {});
  };

  const handleConfigSaved = (updated: SprintConfig) => {
    setSprintConfig(updated);
    // Re-run detection with new config
    if (automationConfigId) {
      detectSprintBranches(jwt, automationConfigId).then(setDetection).catch(() => {});
    }
  };

  const hasNewBranches = detection?.hasNewBranches && !isDetectionDismissed;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-default-400 text-sm">
        {messages.loadingBoard}
      </div>
    );
  }

  if (!automationConfigId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
        <LayoutDashboard size={40} className="text-default-300" />
        <p className="text-default-500 text-sm max-w-sm">
          Set up an Automation config first to use the Sprint Flow board.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-default-200 dark:border-neutral-700 shrink-0">
        <h3 className="font-semibold text-sm">Sprint Flow</h3>
        <div className="flex-1" />
        {hasNewBranches && detection && (
          <span className="text-xs text-primary flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
            {detection.newBranchCount} new branch{detection.newBranchCount !== 1 ? 'es' : ''} detected
            <Button size="sm" color="primary" variant="flat" className="h-6 min-w-0 px-2 text-xs" onPress={openStartModal}>
              Start Sprint
            </Button>
            <button className="text-default-400 hover:text-default-600" onClick={() => setIsDetectionDismissed(true)}>
              <X size={12} />
            </button>
          </span>
        )}
        <Button size="sm" variant="light" isIconOnly onPress={loadAll} title={messages.refreshBoard}>
          <RefreshCw size={14} />
        </Button>
      </div>

      {/* Source repo not connected notice */}
      {!hasSourceRepo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-warning-50 dark:bg-warning-900/20 border-b border-warning-200 shrink-0 text-sm text-warning-700 dark:text-warning-400">
          <AlertCircle size={14} className="shrink-0" />
          {messages.setupNoSourceRepo}
        </div>
      )}

      {/* Main layout: sidebar + board */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sprint list sidebar ── */}
        <div className="w-56 shrink-0 border-r border-default-200 dark:border-neutral-700 flex flex-col overflow-hidden">
          {/* Sidebar header */}
          <div className="flex items-center px-3 py-2 border-b border-default-200 dark:border-neutral-700 shrink-0">
            <span className="text-xs font-semibold text-default-500 uppercase tracking-wide flex-1">
              {messages.sprintList}
            </span>
            <Button
              size="sm"
              variant="light"
              isIconOnly
              onPress={openStartModal}
              title={messages.newSprint}
            >
              <Plus size={15} />
            </Button>
          </div>

          {/* Sprint items */}
          <div className="flex-1 overflow-y-auto py-1">
            {flows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
                <GitBranch size={24} className="text-default-300" />
                <p className="text-xs text-default-400">{messages.noFlowsDesc}</p>
                <Button size="sm" color="primary" startContent={<Plus size={12} />} onPress={openStartModal}>
                  {messages.newSprint}
                </Button>
              </div>
            ) : (
              flows.map((f) => {
                const isSelected = activeFlow?.id === f.id;
                const borderColor = STATUS_ROW_COLORS[f.status] || 'border-l-default-200';
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => selectFlow(f)}
                    className={`
                      w-full text-left px-3 py-2.5 border-l-4 ${borderColor} transition-colors
                      ${isSelected
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : 'hover:bg-default-100 dark:hover:bg-neutral-800'}
                    `}
                  >
                    <p className={`text-xs font-medium truncate ${isSelected ? 'text-primary' : 'text-default-700 dark:text-default-300'}`}>
                      {f.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_COLORS[f.status]}`} />
                      <span className="text-[10px] text-default-400">
                        {statusLabel(f.status, messages)}
                      </span>
                      <span className="text-[10px] text-default-300">·</span>
                      <span className="text-[10px] text-default-400">
                        {messages.branchCount.replace('{count}', String(f.branchSnapshot?.length ?? 0))}
                      </span>
                    </div>
                    <p className="text-[10px] text-default-300 mt-0.5">{formatShortDate(f.createdAt)}</p>
                  </button>
                );
              })
            )}
          </div>

          {/* Configure detection footer */}
          <div className="border-t border-default-200 dark:border-neutral-700 p-2 shrink-0">
            <Button
              size="sm"
              variant="light"
              startContent={<Settings size={13} />}
              className="w-full justify-start text-default-500 text-xs"
              onPress={() => setIsConfigOpen(true)}
            >
              {messages.detectionSettings}
            </Button>
          </div>
        </div>

        {/* ── Board area ── */}
        {activeFlow ? (
          <>
            <div className="flex-1 overflow-hidden">
              <SprintBoard
                flow={activeFlow}
                selectedNodeId={selectedNodeId}
                onNodeClick={handleNodeClick}
                onPositionsChange={handlePositionsChange}
                onGenerateClick={handleGenerateClick}
              />
            </div>
            <DetailPanel
              jwt={jwt}
              mode={detailMode}
              flow={activeFlow}
              selectedBranch={selectedBranch}
              draft={draft}
              onClose={() => { setDetailMode(null); setSelectedNodeId(null); }}
              onGenerationComplete={handleGenerationComplete}
              onDraftChange={setDraft}
              onApproved={handleApproved}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <LayoutDashboard size={48} className="text-default-200" />
            <div>
              <p className="font-medium text-default-600">{messages.noFlows}</p>
              <p className="text-sm text-default-400 mt-1">{messages.noFlowsDesc}</p>
            </div>
            {hasSourceRepo && !sprintConfig?.sourceBranch ? (
              <Button
                variant="bordered"
                startContent={<GitBranch size={15} />}
                onPress={() => { setWizardStep(1); setIsWizardOpen(true); }}
              >
                Configure Sprint Detection
              </Button>
            ) : (
              <Button color="primary" startContent={<Plus size={15} />} onPress={openStartModal}>
                Start First Sprint
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Setup Wizard Modal */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => { setIsWizardOpen(false); setWizardStep(1); }}
        size="lg"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>{messages.setupWizardTitle}</span>
            <span className="text-xs font-normal text-default-500">
              {messages.stepOfSteps.replace('{current}', String(wizardStep)).replace('{total}', '2')}
            </span>
          </ModalHeader>
          <ModalBody className="pb-2">
            <p className="text-sm text-default-500 mb-4">{messages.setupWizardSubtitle}</p>

            {wizardStep === 1 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">{messages.deploymentFlowLabel}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'gitflow', label: messages.flowGitflow, desc: messages.flowGitflowDesc },
                      { id: 'github-flow', label: messages.flowGithubFlow, desc: messages.flowGithubFlowDesc },
                      { id: 'trunk', label: messages.flowTrunk, desc: messages.flowTrunkDesc },
                      { id: 'custom', label: messages.flowCustom, desc: messages.flowCustomDesc },
                    ] as { id: DeploymentFlow; label: string; desc: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleWizardFlowChange(opt.id)}
                      className={`text-left p-3 rounded-lg border-2 transition-colors ${
                        wizardFlow === opt.id
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
            )}

            {wizardStep === 2 && (
              <div className="flex flex-col gap-4">
                <Input
                  label={messages.sourceBranchLabel}
                  placeholder={messages.sourceBranchPlaceholder}
                  value={wizardSourceBranch}
                  onValueChange={setWizardSourceBranch}
                  variant="bordered"
                  description={messages.sourceBranchDesc}
                  isRequired
                  autoFocus
                />
                <div className="text-xs text-default-500 bg-default-50 dark:bg-default-800 rounded-lg p-3">
                  <p className="font-medium mb-1">Key branches excluded from detection:</p>
                  <p className="font-mono">{FLOW_KEY_BRANCHES[wizardFlow].join(', ')}</p>
                  {wizardSourceBranch && <p className="mt-0.5">+ <span className="font-mono">{wizardSourceBranch}</span></p>}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {wizardStep === 2 && (
              <Button variant="flat" onPress={() => setWizardStep(1)}>{messages.back}</Button>
            )}
            <Button variant="flat" onPress={() => { setIsWizardOpen(false); setWizardStep(1); }}>
              {messages.cancel}
            </Button>
            {wizardStep === 1 ? (
              <Button color="primary" onPress={() => setWizardStep(2)}>{messages.next}</Button>
            ) : (
              <Button
                color="primary"
                isLoading={isSavingWizard}
                isDisabled={!wizardSourceBranch.trim() || isSavingWizard}
                onPress={handleWizardSave}
              >
                {isSavingWizard ? messages.savingFlowSetup : messages.saveFlowSetup}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Start sprint modal */}
      <Modal isOpen={isStartModalOpen} onClose={() => setIsStartModalOpen(false)}>
        <ModalContent>
          <ModalHeader>{messages.startSprintTitle}</ModalHeader>
          <ModalBody className="flex flex-col gap-4">
            <Input
              label={messages.sprintTitle}
              placeholder={`Sprint — ${new Date().toLocaleDateString()}`}
              value={newTitle}
              onValueChange={setNewTitle}
              variant="bordered"
              isRequired
            />
            <Input
              label={messages.baseBranch}
              placeholder={sprintConfig?.sourceBranch || 'main'}
              value={newBaseBranch}
              onValueChange={setNewBaseBranch}
              variant="bordered"
              description="Feature branches are detected from this branch"
            />
            <Input
              label={messages.versionBranch}
              placeholder={messages.versionBranchPlaceholder}
              value={newVersionBranch}
              onValueChange={setNewVersionBranch}
              variant="bordered"
              description="All feature branches have PRs targeting this branch"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsStartModalOpen(false)}>{messages.cancel}</Button>
            <Button
              color="primary"
              isLoading={isStarting}
              isDisabled={!newTitle.trim() || isStarting}
              onPress={handleStartSprint}
            >
              {isStarting ? messages.starting : messages.start}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Detection settings modal */}
      <SprintConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={sprintConfig}
        onSaved={handleConfigSaved}
        jwt={jwt}
        messages={messages}
      />
    </div>
  );
}
