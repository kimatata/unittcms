'use client';
import { useState, useEffect, useContext } from 'react';
import { Button, Input, Chip, Divider } from '@heroui/react';
import { addToast } from '@heroui/react';
import { Pencil, Trash, BrainCircuit, Github, GitBranch, CheckCircle } from 'lucide-react';
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

type FieldDef = {
  key: string;
  labelKey: keyof IntegrationsMessages;
  placeholderKey: keyof IntegrationsMessages;
  type: 'password' | 'text';
  required: boolean;
  defaultValue?: string;
  isSettings?: boolean; // stored in settings JSON, not apiKey
};

type ServiceDef = {
  service: string;
  labelKey: keyof IntegrationsMessages;
  descriptionKey: keyof IntegrationsMessages;
  icon: React.ReactNode;
  fields: FieldDef[];
};

const ICON_SIZE = 20;

const SERVICE_DEFS: ServiceDef[] = [
  {
    service: 'github',
    labelKey: 'github',
    descriptionKey: 'githubDescription',
    icon: <Github size={ICON_SIZE} className="text-default-500 shrink-0" />,
    fields: [
      {
        key: 'apiKey',
        labelKey: 'token',
        placeholderKey: 'githubTokenPlaceholder',
        type: 'password',
        required: true,
      },
      {
        key: 'instanceUrl',
        labelKey: 'instanceUrl',
        placeholderKey: 'instanceUrl',
        type: 'text',
        required: false,
        defaultValue: 'https://github.com',
        isSettings: true,
      },
      {
        key: 'namespace',
        labelKey: 'namespace',
        placeholderKey: 'namespacePlaceholder',
        type: 'text',
        required: false,
        isSettings: true,
      },
    ],
  },
  {
    service: 'gitlab',
    labelKey: 'gitlab',
    descriptionKey: 'gitlabDescription',
    icon: <GitBranch size={ICON_SIZE} className="text-default-500 shrink-0" />,
    fields: [
      {
        key: 'apiKey',
        labelKey: 'token',
        placeholderKey: 'gitlabTokenPlaceholder',
        type: 'password',
        required: true,
      },
      {
        key: 'instanceUrl',
        labelKey: 'instanceUrl',
        placeholderKey: 'instanceUrl',
        type: 'text',
        required: false,
        defaultValue: 'https://gitlab.com',
        isSettings: true,
      },
      {
        key: 'namespace',
        labelKey: 'namespace',
        placeholderKey: 'namespacePlaceholder',
        type: 'text',
        required: false,
        isSettings: true,
      },
    ],
  },
];

const AI_SERVICE_DEFS: ServiceDef[] = [
  {
    service: 'anthropic',
    labelKey: 'anthropic',
    descriptionKey: 'anthropicDescription',
    icon: <BrainCircuit size={ICON_SIZE} className="text-default-500 shrink-0" />,
    fields: [
      {
        key: 'apiKey',
        labelKey: 'apiKey',
        placeholderKey: 'apiKeyPlaceholder',
        type: 'password',
        required: true,
      },
    ],
  },
];

export default function IntegrationsPage({ projectId, messages }: Props) {
  const context = useContext(TokenContext);
  const [configs, setConfigs] = useState<IntegrationConfigType[]>([]);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IntegrationConfigType | null>(null);

  useEffect(() => {
    if (!context.isSignedIn()) return;
    fetchIntegrationConfigs(context.token.access_token, Number(projectId)).then(setConfigs);
  }, [context, projectId]);

  const getConfig = (service: string) => configs.find((c) => c.service === service) ?? null;

  const handleEdit = (def: ServiceDef) => {
    const existing = getConfig(def.service);
    const initial: Record<string, string> = {};
    for (const field of def.fields) {
      if (field.key === 'apiKey') {
        initial[field.key] = existing ? '' : '';
      } else if (field.isSettings) {
        initial[field.key] = existing?.settings?.[field.key] ?? field.defaultValue ?? '';
      }
    }
    setFieldValues(initial);
    setEditingService(def.service);
  };

  const handleCancel = () => {
    setEditingService(null);
    setFieldValues({});
  };

  const handleSave = async (def: ServiceDef) => {
    const apiKey = fieldValues['apiKey'] ?? '';
    const existing = getConfig(def.service);

    // apiKey required only if no existing config or user entered a new one
    if (!existing && !apiKey.trim()) return;

    setIsSaving(true);
    try {
      const settings: Record<string, string> = {};
      for (const field of def.fields) {
        if (field.isSettings && fieldValues[field.key]) {
          settings[field.key] = fieldValues[field.key];
        }
      }

      const tokenToSend = apiKey.trim() || (existing ? existing.apiKey : '');
      const updated = await upsertIntegrationConfig(
        context.token.access_token,
        Number(projectId),
        def.service,
        tokenToSend,
        Object.keys(settings).length > 0 ? settings : undefined
      );

      setConfigs((prev) => {
        const idx = prev.findIndex((c) => c.service === def.service);
        return idx >= 0 ? prev.map((c, i) => (i === idx ? updated : c)) : [...prev, updated];
      });
      setEditingService(null);
      setFieldValues({});
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

  const renderServiceCard = (def: ServiceDef) => {
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
            {def.icon}
            <div>
              <p className="font-medium text-sm">{messages[def.labelKey]}</p>
              <p className="text-xs text-default-500">{messages[def.descriptionKey]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {existing ? (
              <Chip color="success" variant="flat" size="sm" startContent={<CheckCircle size={12} />}>
                {messages.connected}
              </Chip>
            ) : (
              <Chip color="default" variant="flat" size="sm">
                {messages.notConfigured}
              </Chip>
            )}
          </div>
        </div>

        {/* Saved values display */}
        {existing && !isEditing && (
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <code className="text-xs text-default-400 font-mono">{existing.apiKey}</code>
              {existing.settings?.instanceUrl && (
                <span className="text-xs text-default-500">{existing.settings.instanceUrl}</span>
              )}
              {existing.settings?.namespace && (
                <span className="text-xs text-default-500">{existing.settings.namespace}</span>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="flat"
                startContent={<Pencil size={14} />}
                onPress={() => handleEdit(def)}
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
          <div className="flex flex-col gap-3">
            {def.fields.map((field) => (
              <Input
                key={field.key}
                label={messages[field.labelKey]}
                placeholder={messages[field.placeholderKey]}
                value={fieldValues[field.key] ?? ''}
                onValueChange={(v) => setFieldValues((prev) => ({ ...prev, [field.key]: v }))}
                type={field.type}
                variant="bordered"
                size="sm"
                isRequired={field.required}
                onFocus={() => {
                  // Clear the masked placeholder when focusing token field
                  if (field.key === 'apiKey' && fieldValues[field.key] === '***') {
                    setFieldValues((prev) => ({ ...prev, [field.key]: '' }));
                  }
                }}
              />
            ))}
            <div className="flex gap-2">
              <Button
                color="primary"
                size="sm"
                isLoading={isSaving}
                isDisabled={
                  !getConfig(def.service) &&
                  !fieldValues['apiKey']?.trim()
                }
                onPress={() => handleSave(def)}
              >
                {isSaving ? messages.saving : messages.saveKey}
              </Button>
              <Button size="sm" variant="flat" onPress={handleCancel}>
                {messages.cancel}
              </Button>
            </div>
          </div>
        )}

        {/* Add button when no config and not editing */}
        {!existing && !isEditing && (
          <Button
            size="sm"
            color="primary"
            variant="flat"
            onPress={() => handleEdit(def)}
            className="self-start"
          >
            + {messages.token}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-3xl pt-6 px-6 flex-grow">
      <div className="w-full p-3 flex items-center justify-between mb-4">
        <h3 className="font-bold">{messages.integrations}</h3>
      </div>

      {/* Git Providers section */}
      <div className="w-full p-3">
        <h4 className="font-semibold text-sm text-default-600 uppercase tracking-wide mb-3">
          {messages.gitProviders}
        </h4>
        <div className="flex flex-col gap-3">
          {SERVICE_DEFS.map(renderServiceCard)}
        </div>
      </div>

      <Divider className="my-2" />

      {/* AI Providers section */}
      <div className="w-full p-3">
        <h4 className="font-semibold text-sm text-default-600 uppercase tracking-wide mb-3">
          {messages.aiProviders}
        </h4>
        <div className="flex flex-col gap-3">
          {AI_SERVICE_DEFS.map(renderServiceCard)}
        </div>
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
