'use client';
import { useState, useEffect, useContext, useCallback } from 'react';
import { Button, Input, Select, SelectItem, Chip, Link, Divider } from '@heroui/react';
import { addToast } from '@heroui/react';
import { ExternalLink, RefreshCw, Play, Wrench } from 'lucide-react';
import { TokenContext } from '@/utils/TokenProvider';
import { AutomationConfigType, AutomationMessages } from '@/types/project';
import {
  fetchAutomationConfig,
  createAutomationConfig,
  updateAutomationConfig,
  generateAutomationProject,
  triggerAutomationRun,
  repairAutomationProject,
  fetchRunStatus,
  RunStatus,
} from '@/utils/automationConfigControl';
import { logError } from '@/utils/errorHandler';

type Props = {
  projectId: string;
  messages: AutomationMessages;
};

const TOOL_OPTIONS = [
  { key: 'playwright', label: 'toolPlaywright' },
  { key: 'cypress', label: 'toolCypress' },
  { key: 'pytest', label: 'toolPytest' },
] as const;

const LANGUAGE_BY_TOOL: Record<string, { key: string; label: string }[]> = {
  playwright: [
    { key: 'typescript', label: 'langTypescript' },
    { key: 'javascript', label: 'langJavascript' },
  ],
  cypress: [
    { key: 'typescript', label: 'langTypescript' },
    { key: 'javascript', label: 'langJavascript' },
  ],
  pytest: [{ key: 'python', label: 'langPython' }],
};

export default function AutomationPage({ projectId, messages }: Props) {
  const context = useContext(TokenContext);

  const [config, setConfig] = useState<AutomationConfigType | null>(null);
  const [provider, setProvider] = useState<'gitlab' | 'github'>('gitlab');
  const [instanceUrl, setInstanceUrl] = useState('https://gitlab.com');
  const [gitlabToken, setGitlabToken] = useState('');
  const [gitlabNamespace, setGitlabNamespace] = useState('');
  const [repoName, setRepoName] = useState('');
  const [automationTool, setAutomationTool] = useState('playwright');
  const [automationLanguage, setAutomationLanguage] = useState('typescript');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [runStatus, setRunStatus] = useState<RunStatus | null>(null);
  const [isFetchingStatus, setIsFetchingStatus] = useState(false);

  const loadRunStatus = useCallback(
    async (cfg: AutomationConfigType) => {
      if (cfg.provider !== 'github' || !cfg.repoUrl) return;
      setIsFetchingStatus(true);
      try {
        const status = await fetchRunStatus(context.token.access_token, cfg.id);
        setRunStatus(status);
      } catch (error) {
        logError('AutomationPage runStatus', error);
      } finally {
        setIsFetchingStatus(false);
      }
    },
    [context]
  );

  useEffect(() => {
    async function load() {
      if (!context.isSignedIn()) return;
      try {
        const data = await fetchAutomationConfig(context.token.access_token, Number(projectId));
        if (data) {
          setConfig(data);
          setProvider(data.provider ?? 'gitlab');
          setInstanceUrl(data.gitlabUrl);
          setGitlabToken('***');
          setGitlabNamespace(data.gitlabNamespace ?? '');
          setRepoName(data.repoName ?? '');
          setAutomationTool(data.automationTool);
          setAutomationLanguage(data.automationLanguage);
          await loadRunStatus(data);
        }
      } catch (error) {
        logError('AutomationPage load', error);
      }
    }
    load();
  }, [context, projectId, loadRunStatus]);

  const handleProviderChange = (value: string) => {
    const p = value as 'gitlab' | 'github';
    setProvider(p);
    setInstanceUrl(p === 'github' ? 'https://github.com' : 'https://gitlab.com');
    setGitlabToken('');
  };

  const handleToolChange = (tool: string) => {
    setAutomationTool(tool);
    const langs = LANGUAGE_BY_TOOL[tool];
    if (langs && !langs.find((l) => l.key === automationLanguage)) {
      setAutomationLanguage(langs[0].key);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        provider,
        gitlabUrl: instanceUrl,
        gitlabToken,
        gitlabNamespace,
        repoName,
        automationTool,
        automationLanguage,
      };
      let updated: AutomationConfigType;
      if (config) {
        updated = await updateAutomationConfig(context.token.access_token, config.id, payload);
      } else {
        updated = await createAutomationConfig(context.token.access_token, {
          projectId: Number(projectId),
          ...payload,
        });
      }
      setConfig(updated);
      setGitlabToken('***');
      addToast({ title: messages.successSaved, color: 'success' });
    } catch (error) {
      logError('AutomationPage save', error);
      addToast({ title: messages.errorSaved, color: 'danger' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!config) return;
    setIsGenerating(true);
    try {
      const updated = await generateAutomationProject(context.token.access_token, config.id);
      setConfig(updated);
      addToast({ title: messages.successGenerated, color: 'success' });
    } catch (error) {
      logError('AutomationPage generate', error);
      addToast({ title: messages.errorGenerated, color: 'danger' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTrigger = async () => {
    if (!config) return;
    setIsTriggering(true);
    try {
      await triggerAutomationRun(context.token.access_token, config.id);
      addToast({ title: messages.successTriggered, color: 'success' });
      // poll once after a short delay so status updates
      setTimeout(() => loadRunStatus(config), 3000);
    } catch (error) {
      logError('AutomationPage trigger', error);
      addToast({ title: messages.errorTriggered, color: 'danger' });
    } finally {
      setIsTriggering(false);
    }
  };

  const handleRepair = async () => {
    if (!config) return;
    setIsRepairing(true);
    try {
      await repairAutomationProject(context.token.access_token, config.id);
      addToast({ title: messages.successRepaired, color: 'success' });
    } catch (error) {
      logError('AutomationPage repair', error);
      addToast({ title: messages.errorRepaired, color: 'danger' });
    } finally {
      setIsRepairing(false);
    }
  };

  const runStatusLabel = (): { label: string; color: 'default' | 'warning' | 'success' | 'danger' } => {
    if (!runStatus?.status) return { label: messages.runStatusNone, color: 'default' };
    if (runStatus.status === 'queued') return { label: messages.runStatusQueued, color: 'warning' };
    if (runStatus.status === 'in_progress') return { label: messages.runStatusInProgress, color: 'warning' };
    if (runStatus.conclusion === 'success') return { label: messages.runStatusSuccess, color: 'success' };
    if (runStatus.conclusion === 'failure') return { label: messages.runStatusFailure, color: 'danger' };
    if (runStatus.conclusion === 'cancelled') return { label: messages.runStatusCancelled, color: 'default' };
    return { label: messages.runStatusNone, color: 'default' };
  };

  const availableLanguages = LANGUAGE_BY_TOOL[automationTool] ?? LANGUAGE_BY_TOOL['playwright'];
  const urlPlaceholder = provider === 'github' ? messages.githubUrlPlaceholder : messages.gitlabUrlPlaceholder;
  const tokenPlaceholder = provider === 'github' ? messages.githubTokenPlaceholder : messages.gitlabTokenPlaceholder;

  return (
    <div className="container mx-auto max-w-3xl pt-6 px-6 flex-grow">
      {/* header */}
      <div className="w-full p-3 flex items-center justify-between mb-2">
        <h3 className="font-bold">{messages.automation}</h3>
        <Chip color={config ? 'success' : 'default'} variant="flat" size="sm">
          {config ? messages.connected : messages.notConnected}
        </Chip>
      </div>

      {/* repo status */}
      {config?.repoUrl && (
        <div className="w-full px-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-default-500">{messages.repoUrl}:</span>
            <Link href={config.repoUrl} isExternal showAnchorIcon size="sm">
              {config.repoUrl}
            </Link>
          </div>
        </div>
      )}

      {/* provider selector */}
      <div className="w-full p-3 flex flex-col gap-4">
        <h4 className="font-semibold text-sm text-default-600 uppercase tracking-wide">{messages.gitlabConnection}</h4>

        <Select
          label={messages.provider}
          selectedKeys={new Set([provider])}
          onSelectionChange={(keys) => handleProviderChange(Array.from(keys)[0] as string)}
          variant="bordered"
          size="sm"
        >
          <SelectItem key="gitlab">{messages.providerGitlab}</SelectItem>
          <SelectItem key="github">{messages.providerGithub}</SelectItem>
        </Select>

        <Input
          label={messages.instanceUrl}
          placeholder={urlPlaceholder}
          value={instanceUrl}
          onValueChange={setInstanceUrl}
          variant="bordered"
          size="sm"
        />

        <Input
          label={messages.gitlabToken}
          placeholder={tokenPlaceholder}
          value={gitlabToken}
          onValueChange={setGitlabToken}
          onFocus={() => { if (gitlabToken === '***') setGitlabToken(''); }}
          type="password"
          variant="bordered"
          size="sm"
        />

        <Input
          label={messages.gitlabNamespace}
          placeholder={provider === 'github' ? 'username or org' : 'username or group/subgroup'}
          value={gitlabNamespace}
          onValueChange={setGitlabNamespace}
          variant="bordered"
          size="sm"
        />
      </div>

      {/* repo configuration */}
      <div className="w-full p-3 flex flex-col gap-4 mt-2">
        <h4 className="font-semibold text-sm text-default-600 uppercase tracking-wide">{messages.repoConfig}</h4>

        <Input
          label={messages.repoName}
          placeholder={messages.repoNamePlaceholder}
          value={repoName}
          onValueChange={setRepoName}
          variant="bordered"
          size="sm"
        />

        <Select
          label={messages.automationTool}
          selectedKeys={new Set([automationTool])}
          onSelectionChange={(keys) => handleToolChange(Array.from(keys)[0] as string)}
          variant="bordered"
          size="sm"
        >
          {TOOL_OPTIONS.map((t) => (
            <SelectItem key={t.key}>{messages[t.label as keyof AutomationMessages]}</SelectItem>
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
            <SelectItem key={l.key}>{messages[l.label as keyof AutomationMessages]}</SelectItem>
          ))}
        </Select>
      </div>

      {/* actions */}
      <div className="w-full p-3 flex flex-wrap gap-3 mt-2">
        <Button
          color="primary"
          size="sm"
          isLoading={isSaving}
          isDisabled={!instanceUrl || !gitlabToken}
          onPress={handleSave}
        >
          {messages.saveConfig}
        </Button>

        <Button
          color="secondary"
          size="sm"
          startContent={!isGenerating ? <RefreshCw size={14} /> : undefined}
          isLoading={isGenerating}
          isDisabled={!config || !repoName}
          onPress={handleGenerate}
        >
          {isGenerating ? messages.generating : messages.generateProject}
        </Button>

        {config?.repoUrl && (
          <Button
            as={Link}
            href={config.repoUrl}
            isExternal
            size="sm"
            variant="flat"
            startContent={<ExternalLink size={14} />}
          >
            {messages.openRepo}
          </Button>
        )}
      </div>

      {/* CI panel — GitHub only */}
      {config?.repoUrl && provider === 'github' && (
        <>
          <Divider className="my-2" />
          <div className="w-full p-3 flex flex-col gap-4 mt-2">
            <h4 className="font-semibold text-sm text-default-600 uppercase tracking-wide">{messages.ciSection}</h4>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-default-500">{messages.ciStatus}:</span>
              {(() => {
                const { label, color } = runStatusLabel();
                return (
                  <Chip color={color} variant="flat" size="sm">
                    {label}
                  </Chip>
                );
              })()}
              {runStatus?.commitSha && (
                <span className="text-xs text-default-400 font-mono">{runStatus.commitSha}</span>
              )}
              {runStatus?.url && (
                <Link href={runStatus.url} isExternal size="sm" showAnchorIcon>
                  {messages.viewRun}
                </Link>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                color="success"
                size="sm"
                startContent={!isTriggering ? <Play size={14} /> : undefined}
                isLoading={isTriggering}
                isDisabled={!config}
                onPress={handleTrigger}
              >
                {isTriggering ? messages.triggering : messages.runTests}
              </Button>
              <Button
                size="sm"
                variant="flat"
                startContent={!isFetchingStatus ? <RefreshCw size={14} /> : undefined}
                isLoading={isFetchingStatus}
                isDisabled={!config}
                onPress={() => config && loadRunStatus(config)}
              >
                {messages.refreshStatus}
              </Button>
              <Button
                size="sm"
                variant="flat"
                color="warning"
                startContent={!isRepairing ? <Wrench size={14} /> : undefined}
                isLoading={isRepairing}
                isDisabled={!config}
                onPress={handleRepair}
              >
                {isRepairing ? messages.repairing : messages.repairCoreFiles}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
