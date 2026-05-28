'use client';
import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { Button, Input, Select, SelectItem, Chip, Link, Divider, Checkbox } from '@heroui/react';
import { addToast } from '@heroui/react';
import {
  ExternalLink,
  RefreshCw,
  Play,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Loader,
  ChevronDown,
  ChevronRight,
  Tag,
  ListChecks,
} from 'lucide-react';
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
  fetchRunErrors,
  fixRunError,
  fetchImplementedCases,
  fetchProjectRuns,
  RunStatus,
  RunError,
  ImplementedCase,
  ProjectRun,
  TriggerOptions,
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

type ErrorFixState = Record<string, 'idle' | 'fixing' | 'fixed' | 'error'>;
type RunMode = 'all' | 'specific' | 'testRun';

// Group implemented cases by folderPath
function groupByFolder(cases: ImplementedCase[]): Record<string, ImplementedCase[]> {
  const groups: Record<string, ImplementedCase[]> = {};
  for (const c of cases) {
    const key = c.folderPath || 'Root';
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }
  return groups;
}

export default function AutomationPage({ projectId, messages }: Props) {
  const context = useContext(TokenContext);

  const [config, setConfig] = useState<AutomationConfigType | null>(null);
  const [provider, setProvider] = useState<'gitlab' | 'github'>('gitlab');
  const [repoName, setRepoName] = useState('');
  const [automationTool, setAutomationTool] = useState('playwright');
  const [automationLanguage, setAutomationLanguage] = useState('typescript');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [runStatus, setRunStatus] = useState<RunStatus | null>(null);
  const [isFetchingStatus, setIsFetchingStatus] = useState(false);
  const [runStatusError, setRunStatusError] = useState<string | null>(null);

  // error list
  const [runErrors, setRunErrors] = useState<RunError[]>([]);
  const [isFetchingErrors, setIsFetchingErrors] = useState(false);
  const [errorFixState, setErrorFixState] = useState<ErrorFixState>({});
  const [commitUrls, setCommitUrls] = useState<Record<string, string>>({});

  // implemented tests panel
  const [implementedCases, setImplementedCases] = useState<ImplementedCase[]>([]);
  const [totalCases, setTotalCases] = useState(0);
  const [isFetchingImplemented, setIsFetchingImplemented] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // run mode
  const [runMode, setRunMode] = useState<RunMode>('all');
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<number>>(new Set());
  const [projectRuns, setProjectRuns] = useState<ProjectRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [isFetchingRuns, setIsFetchingRuns] = useState(false);

  // track previous run status to detect failure transitions
  const prevConclusionRef = useRef<string | null>(null);

  const loadRunStatus = useCallback(
    async (cfg: AutomationConfigType) => {
      if (cfg.provider !== 'github' || !cfg.repoUrl) return;
      setIsFetchingStatus(true);
      setRunStatusError(null);
      try {
        const status = await fetchRunStatus(context.token.access_token, cfg.id);
        setRunStatus(status);
      } catch (error) {
        logError('AutomationPage runStatus', error);
        if ((error as { status?: number }).status === 422) {
          setRunStatusError((error as Error).message);
        }
      } finally {
        setIsFetchingStatus(false);
      }
    },
    [context]
  );

  const loadRunErrors = useCallback(
    async (cfg: AutomationConfigType) => {
      setIsFetchingErrors(true);
      setRunErrors([]);
      setErrorFixState({});
      setCommitUrls({});
      try {
        const errors = await fetchRunErrors(context.token.access_token, cfg.id);
        setRunErrors(errors);
      } catch (error) {
        logError('AutomationPage fetchErrors', error);
      } finally {
        setIsFetchingErrors(false);
      }
    },
    [context]
  );

  const loadImplementedCases = useCallback(
    async (cfg: AutomationConfigType) => {
      setIsFetchingImplemented(true);
      try {
        const data = await fetchImplementedCases(context.token.access_token, cfg.id);
        setImplementedCases(data.cases);
        setTotalCases(data.totalCases);
        // Auto-expand all folders on first load
        const folders = new Set(data.cases.map((c) => c.folderPath || 'Root'));
        setExpandedFolders(folders);
      } catch (error) {
        logError('AutomationPage implementedCases', error);
      } finally {
        setIsFetchingImplemented(false);
      }
    },
    [context]
  );

  const loadProjectRuns = useCallback(
    async (cfg: AutomationConfigType) => {
      setIsFetchingRuns(true);
      try {
        const runs = await fetchProjectRuns(context.token.access_token, cfg.id);
        setProjectRuns(runs);
      } catch (error) {
        logError('AutomationPage projectRuns', error);
      } finally {
        setIsFetchingRuns(false);
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
          setRepoName(data.repoName ?? '');
          setAutomationTool(data.automationTool);
          setAutomationLanguage(data.automationLanguage);
          await Promise.all([loadRunStatus(data), loadImplementedCases(data)]);
        }
      } catch (error) {
        logError('AutomationPage load', error);
      }
    }
    load();
  }, [context, projectId, loadRunStatus, loadImplementedCases]);

  // Load project runs when testRun mode is selected
  useEffect(() => {
    if (runMode === 'testRun' && config && projectRuns.length === 0) {
      loadProjectRuns(config);
    }
  }, [runMode, config, projectRuns.length, loadProjectRuns]);

  // Auto-poll while a run is active
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const isActive = runStatus?.status === 'queued' || runStatus?.status === 'in_progress';

    if (isActive && config) {
      if (!pollRef.current) {
        pollRef.current = setInterval(() => loadRunStatus(config), 10_000);
      }
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [runStatus?.status, config, loadRunStatus]);

  // When a run transitions to failure, load errors (and auto-fix if enabled)
  useEffect(() => {
    const prev = prevConclusionRef.current;
    const current = runStatus?.conclusion ?? null;

    if (current === 'failure' && prev !== 'failure' && config) {
      loadRunErrors(config);
    }
    prevConclusionRef.current = current;
  }, [runStatus?.conclusion, config, loadRunErrors]);

  // Auto-fix: when errors are loaded and autoFixEnabled, fix them all
  useEffect(() => {
    if (!config?.autoFixEnabled || runErrors.length === 0) return;
    const allIdle = runErrors.every((e) => (errorFixState[e.id] ?? 'idle') === 'idle');
    if (!allIdle) return;

    runErrors.forEach((error) => {
      handleFixError(error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runErrors]);

  const handleFixError = async (error: RunError) => {
    if (!config) return;
    setErrorFixState((prev) => ({ ...prev, [error.id]: 'fixing' }));
    try {
      const result = await fixRunError(context.token.access_token, config.id, error);
      setErrorFixState((prev) => ({ ...prev, [error.id]: 'fixed' }));
      if (result.commitUrl) {
        setCommitUrls((prev) => ({ ...prev, [error.id]: result.commitUrl! }));
      }
      addToast({ title: messages.fixSuccess, color: 'success' });
    } catch (err) {
      logError('AutomationPage fixError', err);
      setErrorFixState((prev) => ({ ...prev, [error.id]: 'error' }));
      addToast({ title: messages.fixError, color: 'danger' });
    }
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
      const payload = { provider, repoName, automationTool, automationLanguage };
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
      const options: TriggerOptions = { mode: runMode };
      if (runMode === 'specific') options.caseIds = Array.from(selectedCaseIds);
      if (runMode === 'testRun' && selectedRunId) options.runId = selectedRunId;

      await triggerAutomationRun(context.token.access_token, config.id, options);
      addToast({ title: messages.successTriggered, color: 'success' });
      setRunErrors([]);
      setErrorFixState({});
      setRunStatus({ status: 'queued', conclusion: null, url: null, runAt: null, commitSha: null });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logError('AutomationPage trigger', error);
      addToast({ title: messages.errorTriggered, description: msg, color: 'danger' });
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
      const msg = error instanceof Error ? error.message : String(error);
      logError('AutomationPage repair', error);
      addToast({ title: messages.errorRepaired, description: msg, color: 'danger' });
    } finally {
      setIsRepairing(false);
    }
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      return next;
    });
  };

  const toggleCaseSelection = (id: number) => {
    setSelectedCaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFolderSelection = (cases: ImplementedCase[]) => {
    const ids = cases.map((c) => c.id);
    const allSelected = ids.every((id) => selectedCaseIds.has(id));
    setSelectedCaseIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
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

  const isTriggerDisabled = () => {
    if (!config || isTriggering) return true;
    if (runMode === 'specific' && selectedCaseIds.size === 0) return true;
    if (runMode === 'testRun' && !selectedRunId) return true;
    return false;
  };

  const triggerButtonLabel = () => {
    if (isTriggering) return messages.triggering;
    if (runMode === 'specific' && selectedCaseIds.size > 0) {
      return messages.runSelectedCount.replace('{count}', String(selectedCaseIds.size));
    }
    return messages.runTests;
  };

  const availableLanguages = LANGUAGE_BY_TOOL[automationTool] ?? LANGUAGE_BY_TOOL['playwright'];
  const isConnected = !!config?.repoUrl;
  const showErrorPanel = runStatus?.conclusion === 'failure' && config?.provider === 'github';
  const caseGroups = groupByFolder(implementedCases);

  return (
    <div className="container mx-auto max-w-3xl pt-6 px-6 flex-grow">
      {/* header */}
      <div className="w-full p-3 flex items-center justify-between mb-2">
        <h3 className="font-bold">{messages.automation}</h3>
        <Chip color={isConnected ? 'success' : 'default'} variant="flat" size="sm">
          {isConnected ? messages.connected : messages.notConnected}
        </Chip>
      </div>

      {/* connected detail — always shown once a repo exists */}
      {config?.repoUrl && (
        <div className="w-full px-3 mb-2">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <Chip color={config.provider === 'github' ? 'default' : 'warning'} variant="flat" size="sm">
              {config.provider === 'github' ? messages.providerGithub : messages.providerGitlab}
            </Chip>
            <span className="text-default-500">{messages.repoUrl}:</span>
            <Link href={config.repoUrl} isExternal showAnchorIcon size="sm">
              {config.repoUrl}
            </Link>
          </div>
        </div>
      )}

      {/* config form — only shown before the project has been created */}
      {!isConnected && (
        <div className="w-full p-3 flex flex-col gap-4">
          <Select
            label={messages.provider}
            selectedKeys={new Set([provider])}
            onSelectionChange={(keys) => setProvider(Array.from(keys)[0] as 'gitlab' | 'github')}
            variant="bordered"
            size="sm"
          >
            <SelectItem key="gitlab">{messages.providerGitlab}</SelectItem>
            <SelectItem key="github">{messages.providerGithub}</SelectItem>
          </Select>

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

          <div className="flex flex-wrap gap-3">
            <Button
              color="primary"
              size="sm"
              isLoading={isSaving}
              isDisabled={!repoName}
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
          </div>
        </div>
      )}

      {/* Implemented tests panel — shown when repo is connected */}
      {isConnected && (
        <>
          <Divider className="my-2" />
          <div className="w-full p-3 flex flex-col gap-3 mt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-default-600 uppercase tracking-wide flex items-center gap-2">
                <ListChecks size={14} />
                {messages.implementedSection}
                {implementedCases.length > 0 && (
                  <Chip color="success" variant="flat" size="sm">
                    {implementedCases.length}
                  </Chip>
                )}
              </h4>
              <div className="flex items-center gap-2">
                {totalCases > 0 && (
                  <span className="text-xs text-default-400">
                    {messages.implementedCount
                      .replace('{count}', String(implementedCases.length))
                      .replace('{total}', String(totalCases))}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  isLoading={isFetchingImplemented}
                  onPress={() => config && loadImplementedCases(config)}
                >
                  {!isFetchingImplemented && <RefreshCw size={12} />}
                </Button>
              </div>
            </div>

            {implementedCases.length === 0 && !isFetchingImplemented && (
              <p className="text-sm text-default-400">{messages.noImplementedTests}</p>
            )}

            {/* Case list grouped by folder */}
            {Object.entries(caseGroups).map(([folderPath, cases]) => {
              const isExpanded = expandedFolders.has(folderPath);
              const folderAllSelected = cases.every((c) => selectedCaseIds.has(c.id));
              const folderSomeSelected = cases.some((c) => selectedCaseIds.has(c.id));

              return (
                <div key={folderPath} className="border-1 dark:border-neutral-700 rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 bg-default-50 dark:bg-neutral-800/50 hover:bg-default-100 text-left"
                    onClick={() => toggleFolder(folderPath)}
                  >
                    {runMode === 'specific' && (
                      <Checkbox
                        size="sm"
                        isSelected={folderAllSelected}
                        isIndeterminate={folderSomeSelected && !folderAllSelected}
                        onValueChange={() => toggleFolderSelection(cases)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select all in ${folderPath}`}
                      />
                    )}
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className="text-sm font-medium flex-1 truncate">{folderPath}</span>
                    <span className="text-xs text-default-400 shrink-0">{cases.length}</span>
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-default-100 dark:divide-neutral-700/50">
                      {cases.map((c) => (
                        <div key={c.id} className="flex items-center gap-2 px-3 py-2">
                          {runMode === 'specific' && (
                            <Checkbox
                              size="sm"
                              isSelected={selectedCaseIds.has(c.id)}
                              onValueChange={() => toggleCaseSelection(c.id)}
                              aria-label={c.title}
                            />
                          )}
                          <span className="text-sm flex-1 truncate">{c.title}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {c.tags.map((tag) => (
                              <Chip key={tag} size="sm" variant="flat" color="secondary" startContent={<Tag size={10} />}>
                                {tag}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* CI panel — GitHub only, shown after project is created */}
      {isConnected && config?.provider === 'github' && (
        <>
          <Divider className="my-2" />
          <div className="w-full p-3 flex flex-col gap-4 mt-2">
            <h4 className="font-semibold text-sm text-default-600 uppercase tracking-wide">{messages.ciSection}</h4>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-default-500">{messages.ciStatus}:</span>
              {runStatusError ? (
                <span className="text-sm text-warning-600 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {runStatusError}
                </span>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Run mode selector */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap">
                {(['all', 'specific', 'testRun'] as RunMode[]).map((mode) => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={runMode === mode ? 'solid' : 'flat'}
                    color={runMode === mode ? 'primary' : 'default'}
                    onPress={() => {
                      setRunMode(mode);
                      if (mode !== 'specific') setSelectedCaseIds(new Set());
                      if (mode !== 'testRun') setSelectedRunId(null);
                    }}
                  >
                    {mode === 'all' && messages.runModeAll}
                    {mode === 'specific' && messages.runModeSelect}
                    {mode === 'testRun' && messages.runModeTestRun}
                  </Button>
                ))}
              </div>

              {/* Test run picker */}
              {runMode === 'testRun' && (
                <Select
                  label={messages.selectTestRunPlaceholder}
                  selectedKeys={selectedRunId ? new Set([String(selectedRunId)]) : new Set()}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0];
                    setSelectedRunId(val ? Number(val) : null);
                  }}
                  variant="bordered"
                  size="sm"
                  isLoading={isFetchingRuns}
                >
                  {projectRuns.map((r) => (
                    <SelectItem key={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </Select>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                color="success"
                size="sm"
                startContent={!isTriggering ? <Play size={14} /> : undefined}
                isLoading={isTriggering}
                isDisabled={isTriggerDisabled()}
                onPress={handleTrigger}
              >
                {triggerButtonLabel()}
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
              <Button
                as={Link}
                href={config.repoUrl ?? undefined}
                isExternal
                size="sm"
                variant="flat"
                startContent={<ExternalLink size={14} />}
              >
                {messages.openRepo}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Error panel — shown when last run failed */}
      {showErrorPanel && (
        <>
          <Divider className="my-2" />
          <div className="w-full p-3 flex flex-col gap-3 mt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-default-600 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle size={14} className="text-danger" />
                {messages.errorsSection}
                {runErrors.length > 0 && (
                  <Chip color="danger" variant="flat" size="sm">
                    {runErrors.length}
                  </Chip>
                )}
              </h4>
              <Button
                size="sm"
                variant="flat"
                startContent={!isFetchingErrors ? <RefreshCw size={14} /> : undefined}
                isLoading={isFetchingErrors}
                isDisabled={!config}
                onPress={() => config && loadRunErrors(config)}
              >
                {isFetchingErrors ? messages.fetchingErrors : messages.fetchErrors}
              </Button>
            </div>

            {config?.autoFixEnabled && runErrors.length > 0 && (
              <p className="text-xs text-warning-600 flex items-center gap-1">
                <Loader size={12} className="animate-spin" />
                {messages.autoFixRunning}
              </p>
            )}

            {runErrors.length === 0 && !isFetchingErrors && (
              <p className="text-sm text-default-400">{messages.noErrorsFound}</p>
            )}

            <div className="flex flex-col gap-2">
              {runErrors.map((error) => {
                const state = errorFixState[error.id] ?? 'idle';
                const commitUrl = commitUrls[error.id];

                return (
                  <div
                    key={error.id}
                    className="border-1 dark:border-neutral-700 rounded-lg p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{error.testName}</p>
                        {error.filePath && (
                          <p className="text-xs text-default-400 font-mono">{error.filePath}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {state === 'fixed' && (
                          <Chip color="success" variant="flat" size="sm" startContent={<CheckCircle size={12} />}>
                            Fixed
                          </Chip>
                        )}
                        {state === 'error' && (
                          <Chip color="danger" variant="flat" size="sm">
                            Failed
                          </Chip>
                        )}
                        {commitUrl && (
                          <Link href={commitUrl} isExternal size="sm" showAnchorIcon>
                            {messages.viewCommit}
                          </Link>
                        )}
                        {state !== 'fixed' && (
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            isLoading={state === 'fixing'}
                            isDisabled={state === 'fixing'}
                            onPress={() => handleFixError(error)}
                          >
                            {state === 'fixing' ? messages.fixing : messages.fixWithAi}
                          </Button>
                        )}
                      </div>
                    </div>
                    <pre className="text-xs text-default-500 bg-default-100 rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-32">
                      {error.errorText}
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
