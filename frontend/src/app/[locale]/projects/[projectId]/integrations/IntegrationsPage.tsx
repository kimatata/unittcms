'use client';
import { useState, useEffect, useContext, useRef } from 'react';
import { Button, Input, Chip, Divider } from '@heroui/react';
import { addToast } from '@heroui/react';
import { Pencil, Trash, BrainCircuit, CheckCircle } from 'lucide-react';
import { TokenContext } from '@/utils/TokenProvider';
import { IntegrationConfigType, IntegrationsMessages } from '@/types/integrations';
import {
  fetchIntegrationConfigs,
  upsertIntegrationConfig,
  deleteIntegrationConfig,
} from '@/utils/integrationConfigControl';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { logError } from '@/utils/errorHandler';

type Props = {
  projectId: string;
  messages: IntegrationsMessages;
};

type ServiceDef = {
  service: string;
  label: string;
  description: string;
  keyPlaceholder: string;
};

const SERVICE_DEFS: ServiceDef[] = [
  {
    service: 'anthropic',
    label: 'Anthropic',
    description: 'anthropicDescription',
    keyPlaceholder: 'apiKeyPlaceholder',
  },
];

export default function IntegrationsPage({ projectId, messages }: Props) {
  const context = useContext(TokenContext);
  const [configs, setConfigs] = useState<IntegrationConfigType[]>([]);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IntegrationConfigType | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!context.isSignedIn()) return;
    fetchIntegrationConfigs(context.token.access_token, Number(projectId)).then(setConfigs);
  }, [context, projectId]);

  useEffect(() => {
    if (editingService && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingService]);

  const getConfig = (service: string) => configs.find((c) => c.service === service) ?? null;

  const handleEdit = (service: string) => {
    setEditingService(service);
    setKeyInput('');
  };

  const handleCancel = () => {
    setEditingService(null);
    setKeyInput('');
  };

  const handleSave = async (service: string) => {
    if (!keyInput.trim()) return;
    setIsSaving(true);
    try {
      const updated = await upsertIntegrationConfig(
        context.token.access_token,
        Number(projectId),
        service,
        keyInput.trim()
      );
      setConfigs((prev) => {
        const idx = prev.findIndex((c) => c.service === service);
        return idx >= 0 ? prev.map((c, i) => (i === idx ? updated : c)) : [...prev, updated];
      });
      setEditingService(null);
      setKeyInput('');
      addToast({ title: messages.successSaved, color: 'success' });
    } catch (error) {
      logError('IntegrationsPage save', error);
      addToast({ title: messages.errorSaved, color: 'danger' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteIntegrationConfig(context.token.access_token, deleteTarget.id);
      setConfigs((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      addToast({ title: messages.successDeleted, color: 'success' });
    } catch (error) {
      logError('IntegrationsPage delete', error);
      addToast({ title: messages.errorDeleted, color: 'danger' });
    }
  };

  return (
    <div className="container mx-auto max-w-3xl pt-6 px-6 flex-grow">
      <div className="w-full p-3 flex items-center justify-between mb-4">
        <h3 className="font-bold">{messages.integrations}</h3>
      </div>

      {/* AI Providers section */}
      <div className="w-full p-3 flex items-center justify-between">
        <h4 className="font-semibold text-sm text-default-600 uppercase tracking-wide">
          {messages.aiProviders}
        </h4>
      </div>

      <div className="flex flex-col gap-3 px-3">
        {SERVICE_DEFS.map((def) => {
          const existing = getConfig(def.service);
          const isEditing = editingService === def.service;

          return (
            <div
              key={def.service}
              className="border-1 dark:border-neutral-700 rounded-lg p-4 flex flex-col gap-3"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BrainCircuit size={20} className="text-default-500 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{def.label}</p>
                    <p className="text-xs text-default-500">
                      {messages[def.description as keyof IntegrationsMessages]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {existing ? (
                    <Chip
                      color="success"
                      variant="flat"
                      size="sm"
                      startContent={<CheckCircle size={12} />}
                    >
                      {messages.connected}
                    </Chip>
                  ) : (
                    <Chip color="default" variant="flat" size="sm">
                      {messages.notConfigured}
                    </Chip>
                  )}
                </div>
              </div>

              {/* Existing key display */}
              {existing && !isEditing && (
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs text-default-400 font-mono">{existing.apiKey}</code>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      startContent={<Pencil size={14} />}
                      onPress={() => handleEdit(def.service)}
                    >
                      {messages.edit}
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      startContent={<Trash size={14} />}
                      onPress={() => setDeleteTarget(existing)}
                    >
                      {messages.deleteKey}
                    </Button>
                  </div>
                </div>
              )}

              {/* Edit / Add form */}
              {isEditing && (
                <div className="flex items-end gap-2">
                  <Input
                    ref={inputRef}
                    label={messages.apiKey}
                    placeholder={messages[def.keyPlaceholder as keyof IntegrationsMessages]}
                    value={keyInput}
                    onValueChange={setKeyInput}
                    type="password"
                    variant="bordered"
                    size="sm"
                    className="flex-1"
                  />
                  <Button
                    color="primary"
                    size="sm"
                    isLoading={isSaving}
                    isDisabled={!keyInput.trim()}
                    onPress={() => handleSave(def.service)}
                  >
                    {isSaving ? messages.saving : messages.saveKey}
                  </Button>
                  <Button size="sm" variant="flat" onPress={handleCancel}>
                    {messages.cancel}
                  </Button>
                </div>
              )}

              {/* Add button when no key and not editing */}
              {!existing && !isEditing && (
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  onPress={() => handleEdit(def.service)}
                  className="self-start"
                >
                  + {messages.apiKey}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        closeText={messages.close}
        confirmText={messages.areYouSure}
        deleteText={messages.delete}
      />
    </div>
  );
}
