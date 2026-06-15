'use client';
import { useState, useEffect, useContext } from 'react';
import { Button, Input, Select, SelectItem, Chip, Divider, Checkbox } from '@heroui/react';
import { addToast } from '@heroui/react';
import { Pencil, Trash, BrainCircuit, Github, GitBranch, CheckCircle, FolderSearch } from 'lucide-react';
import { TokenContext } from '@/utils/TokenProvider';
import { IntegrationConfigType, IntegrationsMessages } from '@/types/integrations';
import { AutomationConfigType } from '@/types/project';
import {
  fetchIntegrationConfigs,
  upsertIntegrationConfig,
  deleteIntegrationConfig,
} from '@/utils/integrationConfigControl';
import {
  fetchAutomationConfig,
  setAutomationConfigCache,
  createAutomationConfig,
  updateAutomationConfig,
  RepoItem,
} from '@/utils/automationConfigControl';
import { updateSourceRepoConfig } from '@/utils/monitorControl';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { logError } from '@/utils/errorHandler';
import RepoPickerModal from '../automation/RepoPickerModal';

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
  isSettings?: boolean;
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
      { key: 'apiKey', labelKey: 'token', placeholderKey: 'githubTokenPlaceholder', type: 'password', required: true },
      { key: 'instanceUrl', labelKey: 'instanceUrl', placeholderKey: 'instanceUrl', type: 'text', required: false, defaultValue: 'https://github.com', isSettings: true },
      { key: 'namespace', labelKey: 'namespace', placeholderKey: 'namespacePlaceholder', type: 'text', required: false, isSettings: true },
    ],
  },
  {
    service: 'gitlab',
    labelKey: 'gitlab',
    descriptionKey: 'gitlabDescription',
    icon: <GitBranch size={ICON_SIZE} className="text-default-500 shrink-0" />,
    fields: [
      { key: 'apiKey', labelKey: 'token', placeholderKey: 'gitlabTokenPlaceholder', type: 'password', required: true },
      { key: 'instanceUrl', labelKey: 'instanceUrl', placeholderKey: 'instanceUrl', type: 'text', required: false, defaultValue: 'https://gitlab.com', isSettings: true },
      { key: 'namespace', labelKey: 'namespace', placeholderKey: 'namespacePlaceholder', type: 'text', required: false, isSettings: true },
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
      { key: 'apiKey', labelKey: 'apiKey', placeholderKey: 'apiKeyPlaceholder', type: 'password', required: true },
    ],
  },
];

const TOOL_OPTIONS = [
  { key: 'playwright', labelKey: 'toolPlaywright' },
  { key: 'cypress', labelKey: 'toolCypress' },
  { key: 'pytest', labelKey: 'toolPytest' },
] as const;

const LANGUAGE_BY_TOOL: Record<string, { key: string; labelKey: keyof IntegrationsMessages }[]> = {
  playwright: [
    { key: 'typescript', labelKey: 'langTypescript' },
    { key: 'javascript', labelKey: 'langJavascript' },
  ],
  cypress: [
    { key: 'typescript', labelKey: 'langTypescript' },
    { key: 'javascript', labelKey: 'langJavascript' },
  ],
  pytest: [{ key: 'python', labelKey: 'langPython' }],
};

function ProviderIcon({ service, size = 16 }: { service: string; size?: number }) {
  return service === 'github'
    ? <Github size={size} className="text-default-500 shrink-0" />
    : <GitBranch size={size} className="text-default-500 shrink-0" />;
}

export default function IntegrationsPage({ projectId, messages }: Props) {
  const context = useContext(TokenContext);
  const jwt = context.token.access_token;
  const [configs, setConfigs] = useState<IntegrationConfigType[]>([]);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IntegrationConfigType | null>(null);

  // Automation config (for project connections)
  const [automationConfig, setAutomationConfig] = useState<AutomationConfigType | null>(null);

  // Source project state
  const [sourceService, setSourceService] = useState<'github' | 'gitlab'>('github');
  const [sourceOwner, setSourceOwner] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceBranch, setSourceBranch] = useState('main');
  const [autoAnalyzeCommits, setAutoAnalyzeCommits] = useState(false);
  const [isSavingSource, setIsSavingSource] = useState(false);
  const [isPickingSource, setIsPickingSource] = useState(false);
  const [isEditingSource, setIsEditingSource] = useState(false);
  const [isDeleteSourceOpen, setIsDeleteSourceOpen] = useState(false);

  // Test project state
  const [testService, setTestService] = useState<'github' | 'gitlab'>('github');
  const [testRepoName, setTestRepoName] = useState('');
  const [testRepoUrl, setTestRepoUrl] = useState('');
  const [testRepoId, setTestRepoId] = useState<number | null>(null);
  const [automationTool, setAutomationTool] = useState('playwright');
  const [automationLanguage, setAutomationLanguage] = useState('typescript');
  const [isSavingTest, setIsSavingTest] = useState(false);
  const [isPickingTest, setIsPickingTest] = useState(false);
  const [isEditingTest, setIsEditingTest] = useState(false);
  const [isDeleteTestOpen, setIsDeleteTestOpen] = useState(false);

  useEffect(() => {
    if (!jwt) return;
    Promise.all([
      fetchIntegrationConfigs(jwt, Number(projectId)),
      fetchAutomationConfig(jwt, Number(projectId)),
    ]).then(([cfgs, cfg]) => {
      setConfigs(cfgs);

      const firstGit = cfgs.find((c) => c.service === 'github' || c.service === 'gitlab');

      if (cfg) {
        setAutomationConfig(cfg);
        setSourceService((cfg.sourceProvider as 'github' | 'gitlab') ?? firstGit?.service as 'github' | 'gitlab' ?? 'github');
        setSourceOwner(cfg.sourceRepoOwner ?? '');
        setSourceName(cfg.sourceRepoName ?? '');
        setSourceBranch(cfg.sourceRepoBranch ?? 'main');
        setAutoAnalyzeCommits(cfg.autoAnalyzeCommits ?? false);
        setTestService((cfg.provider as 'github' | 'gitlab') ?? firstGit?.service as 'github' | 'gitlab' ?? 'github');
        setTestRepoName(cfg.repoName ?? '');
        setTestRepoUrl(cfg.repoUrl ?? '');
        setAutomationTool(cfg.automationTool ?? 'playwright');
        setAutomationLanguage(cfg.automationLanguage ?? 'typescript');
      } else if (firstGit) {
        setSourceService(firstGit.service as 'github' | 'gitlab');
        setTestService(firstGit.service as 'github' | 'gitlab');
      }
    });
  }, [jwt, projectId]);

  const getConfig = (service: string) => configs.find((c) => c.service === service) ?? null;
  const isGitConnected = (service: 'github' | 'gitlab') => !!getConfig(service);

  const handleEdit = (def: ServiceDef) => {
    const existing = getConfig(def.service);
    const initial: Record<string, string> = {};
    for (const field of def.fields) {
      if (field.key === 'apiKey') initial[field.key] = '';
      else if (field.isSettings) initial[field.key] = existing?.settings?.[field.key] ?? field.defaultValue ?? '';
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
    if (!existing && !apiKey.trim()) return;
    setIsSaving(true);
    try {
      const settings: Record<string, string> = {};
      for (const field of def.fields) {
        if (field.isSettings && fieldValues[field.key]) settings[field.key] = fieldValues[field.key];
      }
      const tokenToSend = apiKey.trim() || (existing ? existing.apiKey : '');
      const updated = await upsertIntegrationConfig(
        jwt, Number(projectId), def.service, tokenToSend,
        Object.keys(settings).length > 0 ? settings : undefined
      );
      setConfigs((prev) => {
        const idx = prev.findIndex((c) => c.service === def.service);
        return idx >= 0 ? prev.map((c, i) => (i === idx ? updated : c)) : [...prev, updated];
      });

      if (!existing && (def.service === 'github' || def.service === 'gitlab')) {
        const newService = def.service as 'github' | 'gitlab';
        if (!getConfig(sourceService)) setSourceService(newService);
        if (!getConfig(testService)) setTestService(newService);
      }

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
      await deleteIntegrationConfig(jwt, deleteTarget.id);
      const remaining = configs.filter((c) => c.id !== deleteTarget.id);
      setConfigs(remaining);

      if (deleteTarget.service === 'github' || deleteTarget.service === 'gitlab') {
        const otherGit = remaining.find((c) => c.service === 'github' || c.service === 'gitlab');
        if (otherGit) {
          const other = otherGit.service as 'github' | 'gitlab';
          if (sourceService === deleteTarget.service) setSourceService(other);
          if (testService === deleteTarget.service) setTestService(other);
        }
      }

      setDeleteTarget(null);
      addToast({ title: messages.successDeleted, color: 'success' });
    } catch (error) {
      logError('IntegrationsPage delete', error);
      addToast({ title: messages.errorDeleted, color: 'danger' });
    }
  };

  const handlePickSourceRepo = (repo: RepoItem) => {
    setIsPickingSource(false);
    const parts = repo.fullName.split('/');
    setSourceOwner(parts[0]);
    setSourceName(parts.slice(1).join('/'));
  };

  const handleSaveSourceProject = async () => {
    setIsSavingSource(true);
    try {
      let cfg = automationConfig;
      if (!cfg) {
        cfg = await createAutomationConfig(jwt, {
          projectId: Number(projectId),
          provider: testService,
          repoName: testRepoName || '',
          automationTool,
          automationLanguage,
        });
      }
      await updateSourceRepoConfig(jwt, cfg.id, {
        sourceRepoOwner: sourceOwner,
        sourceRepoName: sourceName,
        sourceRepoBranch: sourceBranch,
        autoAnalyzeCommits,
        sourceProvider: sourceService,
      });
      const updated = { ...cfg, sourceRepoOwner: sourceOwner, sourceRepoName: sourceName, sourceRepoBranch: sourceBranch, autoAnalyzeCommits, sourceProvider: sourceService };
      setAutomationConfig(updated);
      setAutomationConfigCache(Number(projectId), updated);
      setIsEditingSource(false);
      addToast({ title: messages.sourceProjectSaved, color: 'success' });
    } catch (err) {
      logError('IntegrationsPage saveSourceProject', err);
      addToast({ title: messages.sourceProjectSaveError, color: 'danger' });
    } finally {
      setIsSavingSource(false);
    }
  };

  const handleCancelSourceEdit = () => {
    setSourceService((automationConfig?.sourceProvider as 'github' | 'gitlab') ?? 'github');
    setSourceOwner(automationConfig?.sourceRepoOwner ?? '');
    setSourceName(automationConfig?.sourceRepoName ?? '');
    setSourceBranch(automationConfig?.sourceRepoBranch ?? 'main');
    setAutoAnalyzeCommits(automationConfig?.autoAnalyzeCommits ?? false);
    setIsEditingSource(false);
  };

  const handleRemoveSourceProject = async () => {
    try {
      if (automationConfig) {
        await updateSourceRepoConfig(jwt, automationConfig.id, {
          sourceRepoOwner: '',
          sourceRepoName: '',
          sourceRepoBranch: 'main',
          autoAnalyzeCommits: false,
          sourceProvider: sourceService,
        });
        const updated = { ...automationConfig, sourceRepoOwner: '', sourceRepoName: '', sourceRepoBranch: 'main', autoAnalyzeCommits: false };
        setAutomationConfig(updated);
        setAutomationConfigCache(Number(projectId), updated);
      }
      setSourceOwner('');
      setSourceName('');
      setSourceBranch('main');
      setAutoAnalyzeCommits(false);
      setIsDeleteSourceOpen(false);
      addToast({ title: messages.sourceProjectRemoved, color: 'success' });
    } catch (err) {
      logError('IntegrationsPage removeSourceProject', err);
      addToast({ title: messages.sourceProjectSaveError, color: 'danger' });
    }
  };

  const handlePickTestRepo = (repo: RepoItem) => {
    setIsPickingTest(false);
    setTestRepoName(repo.name);
    setTestRepoUrl(repo.url);
    setTestRepoId(repo.id);
  };

  const handleSaveTestProject = async () => {
    setIsSavingTest(true);
    try {
      const payload = {
        provider: testService,
        repoName: testRepoName,
        automationTool,
        automationLanguage,
        repoUrl: testRepoUrl || undefined,
        repoId: testRepoId ?? undefined,
      };
      let updated: AutomationConfigType;
      if (automationConfig) {
        updated = await updateAutomationConfig(jwt, automationConfig.id, payload);
      } else {
        updated = await createAutomationConfig(jwt, { projectId: Number(projectId), ...payload });
      }
      setAutomationConfig(updated);
      setAutomationConfigCache(Number(projectId), updated);
      setIsEditingTest(false);
      addToast({ title: messages.testProjectSaved, color: 'success' });
    } catch (err) {
      logError('IntegrationsPage saveTestProject', err);
      addToast({ title: messages.testProjectSaveError, color: 'danger' });
    } finally {
      setIsSavingTest(false);
    }
  };

  const handleCancelTestEdit = () => {
    setTestService((automationConfig?.provider as 'github' | 'gitlab') ?? 'github');
    setTestRepoName(automationConfig?.repoName ?? '');
    setTestRepoUrl(automationConfig?.repoUrl ?? '');
    setAutomationTool(automationConfig?.automationTool ?? 'playwright');
    setAutomationLanguage(automationConfig?.automationLanguage ?? 'typescript');
    setIsEditingTest(false);
  };

  const handleRemoveTestProject = async () => {
    try {
      if (automationConfig) {
        const updated = await updateAutomationConfig(jwt, automationConfig.id, {
          repoName: '',
          repoUrl: undefined,
          repoId: undefined,
        });
        setAutomationConfig(updated);
        setAutomationConfigCache(Number(projectId), updated);
      }
      setTestRepoName('');
      setTestRepoUrl('');
      setTestRepoId(null);
      setIsDeleteTestOpen(false);
      addToast({ title: messages.testProjectRemoved, color: 'success' });
    } catch (err) {
      logError('IntegrationsPage removeTestProject', err);
      addToast({ title: messages.testProjectSaveError, color: 'danger' });
    }
  };

  const availableLanguages = LANGUAGE_BY_TOOL[automationTool] ?? LANGUAGE_BY_TOOL['playwright'];

  const sourceConnected = !!(sourceOwner && sourceName);
  const testConnected = !!testRepoName;

  const renderServiceCard = (def: ServiceDef) => {
    const existing = getConfig(def.service);
    const isEditing = editingService === def.service;

    return (
      <div key={def.service} className="border-1 dark:border-neutral-700 rounded-lg p-4 flex flex-col gap-3">
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
              <Chip color="default" variant="flat" size="sm">{messages.notConfigured}</Chip>
            )}
          </div>
        </div>

        {existing && !isEditing && (
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <code className="text-xs text-default-400 font-mono">{existing.apiKey}</code>
              {existing.settings?.instanceUrl && <span className="text-xs text-default-500">{existing.settings.instanceUrl}</span>}
              {existing.settings?.namespace && <span className="text-xs text-default-500">{existing.settings.namespace}</span>}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="flat" startContent={<Pencil size={14} />} onPress={() => handleEdit(def)}>
                {messages.edit}
              </Button>
              <Button size="sm" color="danger" variant="flat" startContent={<Trash size={14} />} onPress={() => setDeleteTarget(existing)}>
                {messages.deleteKey}
              </Button>
            </div>
          </div>
        )}

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
                isDisabled={!getConfig(def.service) && !fieldValues['apiKey']?.trim()}
                onPress={() => handleSave(def)}
              >
                {isSaving ? messages.saving : messages.saveKey}
              </Button>
              <Button size="sm" variant="flat" onPress={handleCancel}>{messages.cancel}</Button>
            </div>
          </div>
        )}

        {!existing && !isEditing && (
          <Button size="sm" color="primary" variant="flat" onPress={() => handleEdit(def)} className="self-start">
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

      {/* Git Providers */}
      <div className="w-full p-3">
        <h4 className="font-semibold text-sm text-default-600 uppercase tracking-wide mb-3">{messages.gitProviders}</h4>
        <div className="flex flex-col gap-3">{SERVICE_DEFS.map(renderServiceCard)}</div>
      </div>

      <Divider className="my-2" />

      {/* Project Connections */}
      <div className="w-full p-3">
        <h4 className="font-semibold text-sm text-default-600 uppercase tracking-wide mb-3">{messages.projectConnections}</h4>
        <div className="flex flex-col gap-3">

          {/* Source Project */}
          <div className="border-1 dark:border-neutral-700 rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">{messages.sourceProject}</p>
              {sourceConnected && !isEditingSource && (
                <Chip color="success" variant="flat" size="sm" startContent={<CheckCircle size={12} />}>
                  {messages.connected}
                </Chip>
              )}
            </div>

            {/* Compact connected view */}
            {sourceConnected && !isEditingSource && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ProviderIcon service={sourceService} />
                  <div>
                    <p className="text-sm font-mono">{sourceOwner}/{sourceName}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Chip size="sm" variant="flat" className="text-xs">{sourceBranch}</Chip>
                      {autoAnalyzeCommits && (
                        <Chip size="sm" variant="flat" color="primary" className="text-xs">Auto-analyze</Chip>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="flat" startContent={<Pencil size={14} />} onPress={() => setIsEditingSource(true)}>
                    {messages.edit}
                  </Button>
                  <Button size="sm" color="danger" variant="flat" startContent={<Trash size={14} />} onPress={() => setIsDeleteSourceOpen(true)}>
                    {messages.deleteKey}
                  </Button>
                </div>
              </div>
            )}

            {/* Edit / configure form */}
            {isEditingSource && (
              <div className="flex flex-col gap-3">
                <div className="flex items-end gap-2">
                  <Select
                    label="Provider"
                    selectedKeys={new Set([sourceService])}
                    onSelectionChange={(keys) => setSourceService(Array.from(keys)[0] as 'github' | 'gitlab')}
                    variant="bordered"
                    size="sm"
                    className="max-w-[160px]"
                  >
                    <SelectItem key="github">{messages.github}</SelectItem>
                    <SelectItem key="gitlab">{messages.gitlab}</SelectItem>
                  </Select>
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<FolderSearch size={14} />}
                    isDisabled={!isGitConnected(sourceService)}
                    onPress={() => setIsPickingSource(true)}
                  >
                    {messages.browse}
                  </Button>
                  {!isGitConnected(sourceService) && (
                    <span className="text-xs text-default-400">
                      {messages.connectProviderFirst.replace('{provider}', sourceService === 'github' ? messages.github : messages.gitlab)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Owner"
                    placeholder="username or org"
                    value={sourceOwner}
                    onValueChange={setSourceOwner}
                    variant="bordered"
                    size="sm"
                  />
                  <Input
                    label="Repo Name"
                    placeholder="my-app"
                    value={sourceName}
                    onValueChange={setSourceName}
                    variant="bordered"
                    size="sm"
                  />
                  <Input
                    label={messages.branch}
                    placeholder={messages.branchPlaceholder}
                    value={sourceBranch}
                    onValueChange={setSourceBranch}
                    variant="bordered"
                    size="sm"
                  />
                </div>

                <Checkbox size="sm" isSelected={autoAnalyzeCommits} onValueChange={setAutoAnalyzeCommits}>
                  <span className="text-sm">{messages.autoAnalyzeCommits}</span>
                </Checkbox>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="primary"
                    isLoading={isSavingSource}
                    isDisabled={!sourceName || isSavingSource}
                    onPress={handleSaveSourceProject}
                  >
                    {isSavingSource ? messages.saving : messages.saveSourceProject}
                  </Button>
                  <Button size="sm" variant="flat" onPress={handleCancelSourceEdit}>{messages.cancel}</Button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!sourceConnected && !isEditingSource && (
              <Button size="sm" color="primary" variant="flat" onPress={() => setIsEditingSource(true)} className="self-start">
                + {messages.configureSourceProject}
              </Button>
            )}
          </div>

          {/* Test Project */}
          <div className="border-1 dark:border-neutral-700 rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">{messages.testProject}</p>
              {testConnected && !isEditingTest && (
                <Chip color="success" variant="flat" size="sm" startContent={<CheckCircle size={12} />}>
                  {messages.connected}
                </Chip>
              )}
            </div>

            {/* Compact connected view */}
            {testConnected && !isEditingTest && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ProviderIcon service={testService} />
                  <div>
                    <p className="text-sm font-mono">{testRepoName}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Chip size="sm" variant="flat" className="text-xs">{automationTool}</Chip>
                      <Chip size="sm" variant="flat" className="text-xs">{automationLanguage}</Chip>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="flat" startContent={<Pencil size={14} />} onPress={() => setIsEditingTest(true)}>
                    {messages.edit}
                  </Button>
                  <Button size="sm" color="danger" variant="flat" startContent={<Trash size={14} />} onPress={() => setIsDeleteTestOpen(true)}>
                    {messages.deleteKey}
                  </Button>
                </div>
              </div>
            )}

            {/* Edit / configure form */}
            {isEditingTest && (
              <div className="flex flex-col gap-3">
                <div className="flex items-end gap-2">
                  <Select
                    label="Provider"
                    selectedKeys={new Set([testService])}
                    onSelectionChange={(keys) => setTestService(Array.from(keys)[0] as 'github' | 'gitlab')}
                    variant="bordered"
                    size="sm"
                    className="max-w-[160px]"
                  >
                    <SelectItem key="github">{messages.github}</SelectItem>
                    <SelectItem key="gitlab">{messages.gitlab}</SelectItem>
                  </Select>
                  <Input
                    label="Repository"
                    placeholder="my-automation-tests"
                    value={testRepoName}
                    onValueChange={setTestRepoName}
                    variant="bordered"
                    size="sm"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<FolderSearch size={14} />}
                    isDisabled={!isGitConnected(testService)}
                    onPress={() => setIsPickingTest(true)}
                  >
                    {messages.browse}
                  </Button>
                </div>
                {!isGitConnected(testService) && (
                  <span className="text-xs text-default-400">
                    {messages.connectProviderFirst.replace('{provider}', testService === 'github' ? messages.github : messages.gitlab)}
                  </span>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label={messages.automationTool}
                    selectedKeys={new Set([automationTool])}
                    onSelectionChange={(keys) => {
                      const tool = Array.from(keys)[0] as string;
                      setAutomationTool(tool);
                      const langs = LANGUAGE_BY_TOOL[tool];
                      if (langs && !langs.find((l) => l.key === automationLanguage)) {
                        setAutomationLanguage(langs[0].key);
                      }
                    }}
                    variant="bordered"
                    size="sm"
                  >
                    {TOOL_OPTIONS.map((t) => (
                      <SelectItem key={t.key}>{messages[t.labelKey]}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    label={messages.automationLanguage}
                    selectedKeys={new Set([automationLanguage])}
                    onSelectionChange={(keys) => setAutomationLanguage(Array.from(keys)[0] as string)}
                    variant="bordered"
                    size="sm"
                  >
                    {availableLanguages.map((l) => (
                      <SelectItem key={l.key}>{messages[l.labelKey]}</SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="primary"
                    isLoading={isSavingTest}
                    isDisabled={!testRepoName || isSavingTest}
                    onPress={handleSaveTestProject}
                  >
                    {isSavingTest ? messages.saving : messages.saveTestProject}
                  </Button>
                  <Button size="sm" variant="flat" onPress={handleCancelTestEdit}>{messages.cancel}</Button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!testConnected && !isEditingTest && (
              <Button size="sm" color="primary" variant="flat" onPress={() => setIsEditingTest(true)} className="self-start">
                + {messages.configureTestProject}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Divider className="my-2" />

      {/* AI Providers */}
      <div className="w-full p-3">
        <h4 className="font-semibold text-sm text-default-600 uppercase tracking-wide mb-3">{messages.aiProviders}</h4>
        <div className="flex flex-col gap-3">{AI_SERVICE_DEFS.map(renderServiceCard)}</div>
      </div>

      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        closeText={messages.close}
        confirmText={messages.areYouSure}
        deleteText={messages.delete}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteSourceOpen}
        onCancel={() => setIsDeleteSourceOpen(false)}
        onConfirm={handleRemoveSourceProject}
        closeText={messages.close}
        confirmText={messages.areYouSure}
        deleteText={messages.delete}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteTestOpen}
        onCancel={() => setIsDeleteTestOpen(false)}
        onConfirm={handleRemoveTestProject}
        closeText={messages.close}
        confirmText={messages.areYouSure}
        deleteText={messages.delete}
      />

      <RepoPickerModal
        isOpen={isPickingSource}
        onClose={() => setIsPickingSource(false)}
        onSelect={handlePickSourceRepo}
        projectId={Number(projectId)}
        service={sourceService}
        jwt={jwt}
        messages={{
          pickRepoTitle: messages.pickRepoTitle,
          searchReposPlaceholder: messages.searchReposPlaceholder,
          loadingRepos: messages.loadingRepos,
          noReposFound: messages.noReposFound,
        }}
      />

      <RepoPickerModal
        isOpen={isPickingTest}
        onClose={() => setIsPickingTest(false)}
        onSelect={handlePickTestRepo}
        projectId={Number(projectId)}
        service={testService}
        jwt={jwt}
        messages={{
          pickRepoTitle: messages.pickRepoTitle,
          searchReposPlaceholder: messages.searchReposPlaceholder,
          loadingRepos: messages.loadingRepos,
          noReposFound: messages.noReposFound,
        }}
      />
    </div>
  );
}
