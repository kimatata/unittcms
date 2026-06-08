'use client';
import { useState, useEffect, useContext, useCallback } from 'react';
import {
  Button, Input, Checkbox, Chip, Link, Divider, Tooltip,
} from '@heroui/react';
import { addToast } from '@heroui/react';
import {
  GitCommitHorizontal, RefreshCw, Zap, AlertTriangle, CheckCircle2,
  Clock, Activity, BarChart3, TriangleAlert, Loader, ExternalLink,
} from 'lucide-react';
import { TokenContext } from '@/utils/TokenProvider';
import { MonitorMessages, AutomationConfigType, SourceCommitType, SyncLogType, TestHealthData } from '@/types/project';
import {
  fetchSourceCommits,
  syncSourceCommits,
  analyzeCommit,
  fetchSyncLogs,
  fetchTestHealth,
  updateSourceRepoConfig,
} from '@/utils/monitorControl';
import { fetchAutomationConfig, setAutomationConfigCache } from '@/utils/automationConfigControl';
import { logError } from '@/utils/errorHandler';

type Props = {
  projectId: string;
  messages: MonitorMessages;
};

type AnalyzeState = Record<string, 'idle' | 'analyzing' | 'done' | 'error'>;

function statusColor(status: string): 'default' | 'warning' | 'success' | 'danger' {
  if (status === 'done') return 'success';
  if (status === 'failed') return 'danger';
  if (status === 'analyzing') return 'warning';
  return 'default';
}

function statusLabel(status: string, messages: MonitorMessages): string {
  if (status === 'new') return messages.commitStatusNew;
  if (status === 'analyzing') return messages.commitStatusAnalyzing;
  if (status === 'done') return messages.commitStatusDone;
  if (status === 'failed') return messages.commitStatusFailed;
  return status;
}

function cellColor(cell: { total: number; passed: number; failed: number } | undefined): string {
  if (!cell || cell.total === 0) return 'bg-default-100 dark:bg-neutral-800';
  if (cell.failed > 0) return 'bg-danger-100 dark:bg-danger-900/30 text-danger-700';
  return 'bg-success-100 dark:bg-success-900/30 text-success-700';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function MonitorPage({ projectId, messages }: Props) {
  const context = useContext(TokenContext);
  const jwt = context.token.access_token;

  const [config, setConfig] = useState<AutomationConfigType | null>(null);

  // Source repo form
  const [sourceOwner, setSourceOwner] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceBranch, setSourceBranch] = useState('main');
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [isSavingRepo, setIsSavingRepo] = useState(false);

  // Commits
  const [commits, setCommits] = useState<SourceCommitType[]>([]);
  const [isSyncingCommits, setIsSyncingCommits] = useState(false);
  const [analyzeState, setAnalyzeState] = useState<AnalyzeState>({});

  // Test health
  const [healthData, setHealthData] = useState<TestHealthData | null>(null);

  // Activity log
  const [syncLogs, setSyncLogs] = useState<SyncLogType[]>([]);

  const isSourceConfigured = !!(config?.sourceRepoName);

  // Derived stats
  const totalCommits = commits.length;
  const coveredCommits = commits.filter((c) => c.status === 'done').length;
  const gapCommits = commits.filter((c) => c.status === 'new' || c.status === 'failed').length;
  const coveragePct = totalCommits > 0 ? Math.round((coveredCommits / totalCommits) * 100) : 0;

  const loadAll = useCallback(async () => {
    if (!jwt) return;
    try {
      const cfg = await fetchAutomationConfig(jwt, Number(projectId));
      if (!cfg) return;
      setConfig(cfg);
      setSourceOwner(cfg.sourceRepoOwner || '');
      setSourceName(cfg.sourceRepoName || '');
      setSourceBranch(cfg.sourceRepoBranch || 'main');
      setAutoAnalyze(cfg.autoAnalyzeCommits || false);

      const [commitsData, logsData, healthRaw] = await Promise.all([
        fetchSourceCommits(jwt, cfg.id).catch(() => [] as SourceCommitType[]),
        fetchSyncLogs(jwt, cfg.id).catch(() => [] as SyncLogType[]),
        fetchTestHealth(jwt, cfg.id).catch(() => null as TestHealthData | null),
      ]);

      setCommits(commitsData);
      setSyncLogs(logsData);
      setHealthData(healthRaw);
    } catch (err) {
      logError('MonitorPage load', err);
    }
  }, [jwt, projectId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSaveSourceRepo = async () => {
    if (!config) return;
    setIsSavingRepo(true);
    try {
      await updateSourceRepoConfig(jwt, config.id, {
        sourceRepoOwner: sourceOwner,
        sourceRepoName: sourceName,
        sourceRepoBranch: sourceBranch,
        autoAnalyzeCommits: autoAnalyze,
      });
      const updated = { ...config, sourceRepoOwner: sourceOwner, sourceRepoName: sourceName, sourceRepoBranch: sourceBranch, autoAnalyzeCommits: autoAnalyze };
      setConfig(updated);
      setAutomationConfigCache(Number(projectId), updated);
      addToast({ title: messages.saveSourceRepoSuccess, color: 'success' });
    } catch (err) {
      logError('MonitorPage saveSourceRepo', err);
      addToast({ title: messages.saveSourceRepoError, color: 'danger' });
    } finally {
      setIsSavingRepo(false);
    }
  };

  const handleSyncCommits = async () => {
    if (!config) return;
    setIsSyncingCommits(true);
    try {
      const result = await syncSourceCommits(jwt, config.id);
      addToast({
        title: messages.syncCommitsSuccess,
        description: messages.syncCommitsResult.replace('{added}', String(result.added)),
        color: 'success',
      });
      const updated = await fetchSourceCommits(jwt, config.id);
      setCommits(updated);
      const logs = await fetchSyncLogs(jwt, config.id);
      setSyncLogs(logs);
    } catch (err) {
      logError('MonitorPage syncCommits', err);
      addToast({ title: messages.syncCommitsError, color: 'danger' });
    } finally {
      setIsSyncingCommits(false);
    }
  };

  const handleAnalyzeCommit = async (commit: SourceCommitType) => {
    if (!config) return;
    setAnalyzeState((prev) => ({ ...prev, [commit.sha]: 'analyzing' }));
    // Optimistically mark as analyzing in list
    setCommits((prev) => prev.map((c) => c.sha === commit.sha ? { ...c, status: 'analyzing' } : c));
    try {
      const result = await analyzeCommit(jwt, config.id, commit.sha);
      setAnalyzeState((prev) => ({ ...prev, [commit.sha]: 'done' }));
      setCommits((prev) => prev.map((c) =>
        c.sha === commit.sha
          ? { ...c, status: 'done', aiSummary: result.aiSummary, testCommitSha: result.testCommitSha, generatedTestCaseIds: JSON.stringify(result.createdCaseIds) }
          : c
      ));
      const desc = messages.analyzeCommitSuccess + (result.caseNames.length > 0 ? `: ${result.caseNames.slice(0, 2).join(', ')}` : '');
      addToast({ title: desc, color: 'success' });
      const logs = await fetchSyncLogs(jwt, config.id);
      setSyncLogs(logs);
    } catch (err) {
      logError('MonitorPage analyzeCommit', err);
      setAnalyzeState((prev) => ({ ...prev, [commit.sha]: 'error' }));
      setCommits((prev) => prev.map((c) => c.sha === commit.sha ? { ...c, status: 'failed' } : c));
      addToast({ title: messages.analyzeCommitError, color: 'danger' });
    }
  };

  const logTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      commit_sync: messages.activityCommitSync,
      ai_analysis: messages.activityAiAnalysis,
      test_sync: messages.activityTestSync,
      webhook: messages.activityWebhook,
    };
    return map[type] || type;
  };

  const logTypeColor = (type: string): 'default' | 'primary' | 'secondary' | 'warning' => {
    if (type === 'ai_analysis') return 'secondary';
    if (type === 'webhook') return 'warning';
    if (type === 'commit_sync') return 'primary';
    return 'default';
  };

  const testRepoBaseUrl = config?.repoUrl;

  return (
    <div className="container mx-auto max-w-4xl pt-6 px-6 flex-grow">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="w-full p-3 flex items-center justify-between mb-2">
        <h3 className="font-bold">{messages.monitor}</h3>
        <Button size="sm" variant="light" isIconOnly onPress={loadAll}>
          <RefreshCw size={14} />
        </Button>
      </div>

      {/* ── Health Bar ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-3 mb-4">
        <div className="flex flex-col items-center justify-center border-1 dark:border-neutral-700 rounded-xl p-3 gap-1">
          <span className="text-2xl font-bold text-success">{coveragePct}%</span>
          <span className="text-xs text-default-400">{messages.healthCoverage}</span>
        </div>
        <div className="flex flex-col items-center justify-center border-1 dark:border-neutral-700 rounded-xl p-3 gap-1">
          <span className="text-2xl font-bold">{totalCommits}</span>
          <span className="text-xs text-default-400">{messages.healthCommitsSynced}</span>
        </div>
        <div className="flex flex-col items-center justify-center border-1 dark:border-neutral-700 rounded-xl p-3 gap-1">
          <span className={`text-2xl font-bold ${gapCommits > 0 ? 'text-danger' : 'text-default-600'}`}>{gapCommits}</span>
          <span className="text-xs text-default-400">{messages.healthOpenGaps}</span>
        </div>
        <div className="flex flex-col items-center justify-center border-1 dark:border-neutral-700 rounded-xl p-3 gap-1">
          <span className="text-2xl font-bold text-default-600">{healthData?.runs.length ?? 0}</span>
          <span className="text-xs text-default-400">{messages.healthLastRun}</span>
        </div>
      </div>

      {/* Coverage progress bar */}
      {totalCommits > 0 && (
        <div className="px-3 mb-4">
          <div className="w-full bg-default-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-success h-2 rounded-full transition-all duration-500"
              style={{ width: `${coveragePct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Source Repo Config ─────────────────────────────────────────── */}
      <Divider className="my-2" />
      <div className="w-full p-3 flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-default-600 uppercase tracking-wide flex items-center gap-2">
            <GitCommitHorizontal size={14} />
            {messages.sourceRepoSection}
          </h4>
          <Chip
            color={isSourceConfigured ? 'success' : 'default'}
            variant="flat"
            size="sm"
          >
            {isSourceConfigured ? messages.sourceRepoConnected : messages.sourceRepoNotConnected}
          </Chip>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label={messages.sourceRepoOwner}
            placeholder={messages.sourceRepoOwnerPlaceholder}
            value={sourceOwner}
            onValueChange={setSourceOwner}
            variant="bordered"
            size="sm"
          />
          <Input
            label={messages.sourceRepoName}
            placeholder={messages.sourceRepoNamePlaceholder}
            value={sourceName}
            onValueChange={setSourceName}
            variant="bordered"
            size="sm"
          />
          <Input
            label={messages.sourceRepoBranch}
            placeholder={messages.sourceRepoBranchPlaceholder}
            value={sourceBranch}
            onValueChange={setSourceBranch}
            variant="bordered"
            size="sm"
          />
        </div>

        <Checkbox
          size="sm"
          isSelected={autoAnalyze}
          onValueChange={setAutoAnalyze}
        >
          <span className="text-sm">{messages.autoAnalyzeCommits}</span>
        </Checkbox>

        <div className="flex gap-3 flex-wrap">
          <Button
            color="primary"
            size="sm"
            isLoading={isSavingRepo}
            isDisabled={!sourceName || isSavingRepo}
            onPress={handleSaveSourceRepo}
          >
            {isSavingRepo ? messages.savingSourceRepo : messages.saveSourceRepo}
          </Button>
          <Button
            color="secondary"
            size="sm"
            variant="flat"
            startContent={!isSyncingCommits ? <RefreshCw size={14} /> : undefined}
            isLoading={isSyncingCommits}
            isDisabled={!isSourceConfigured || isSyncingCommits}
            onPress={handleSyncCommits}
          >
            {isSyncingCommits ? messages.syncingCommits : messages.syncCommits}
          </Button>
        </div>
      </div>

      {/* ── Commit Coverage Timeline ───────────────────────────────────── */}
      <Divider className="my-2" />
      <div className="w-full p-3 flex flex-col gap-3 mt-2">
        <h4 className="font-semibold text-sm text-default-600 uppercase tracking-wide flex items-center gap-2">
          <Activity size={14} />
          {messages.commitTimelineSection}
          {totalCommits > 0 && (
            <Chip size="sm" variant="flat" color="default">{totalCommits}</Chip>
          )}
        </h4>

        {commits.length === 0 && (
          <p className="text-sm text-default-400">{messages.noCommitsSynced}</p>
        )}

        {/* Gap alert banner */}
        {gapCommits > 0 && (
          <div className="flex items-center gap-2 bg-danger-50 dark:bg-danger-900/20 border-1 border-danger-200 dark:border-danger-800 rounded-lg px-3 py-2">
            <TriangleAlert size={14} className="text-danger shrink-0" />
            <span className="text-sm text-danger-700 dark:text-danger-300 flex-1">
              {gapCommits} commit{gapCommits !== 1 ? 's' : ''} with no test coverage
            </span>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              onPress={() => {
                const unanalyzed = commits.filter((c) => c.status === 'new');
                unanalyzed.forEach((c) => handleAnalyzeCommit(c));
              }}
              isDisabled={!config}
            >
              Analyze All
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {commits.map((commit) => {
            const state = analyzeState[commit.sha];
            const isAnalyzing = state === 'analyzing' || commit.status === 'analyzing';
            const generatedCount = (() => {
              try { return commit.generatedTestCaseIds ? JSON.parse(commit.generatedTestCaseIds).length : 0; }
              catch { return 0; }
            })();
            const testCommitUrl = commit.testCommitSha && testRepoBaseUrl
              ? (config?.provider === 'github'
                  ? `${testRepoBaseUrl}/commit/${commit.testCommitSha}`
                  : `${testRepoBaseUrl}/-/commit/${commit.testCommitSha}`)
              : null;

            return (
              <div
                key={commit.sha}
                className="border-1 dark:border-neutral-700 rounded-lg p-3 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <GitCommitHorizontal size={16} className="text-default-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {commit.message?.split('\n')[0] || '(no message)'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-default-400 mt-0.5">
                        <span className="font-mono">{commit.sha.slice(0, 7)}</span>
                        {commit.author && <span>· {commit.author}</span>}
                        {commit.committedAt && <span>· {formatDate(commit.committedAt)}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Chip color={statusColor(commit.status)} variant="flat" size="sm">
                      {isAnalyzing
                        ? <span className="flex items-center gap-1"><Loader size={10} className="animate-spin" />{messages.commitStatusAnalyzing}</span>
                        : statusLabel(commit.status, messages)
                      }
                    </Chip>

                    {testCommitUrl && (
                      <Tooltip content={messages.viewTestCommit}>
                        <Link href={testCommitUrl} isExternal size="sm">
                          <ExternalLink size={12} />
                        </Link>
                      </Tooltip>
                    )}

                    {(commit.status === 'new' || commit.status === 'failed') && !isAnalyzing && (
                      <Button
                        size="sm"
                        color="secondary"
                        variant="flat"
                        isLoading={isAnalyzing}
                        isDisabled={isAnalyzing || !config}
                        onPress={() => handleAnalyzeCommit(commit)}
                        startContent={!isAnalyzing ? <Zap size={12} /> : undefined}
                      >
                        {messages.analyzeCommit}
                      </Button>
                    )}
                  </div>
                </div>

                {/* AI summary + generated count */}
                {commit.aiSummary && (
                  <div className="flex items-start gap-2 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg px-3 py-2">
                    <CheckCircle2 size={14} className="text-secondary mt-0.5 shrink-0" />
                    <div className="text-xs text-default-600 flex-1">
                      {generatedCount > 0 && (
                        <span className="font-medium text-secondary mr-2">
                          {messages.generatedCases.replace('{count}', String(generatedCount))}
                        </span>
                      )}
                      {commit.aiSummary.split('\n').slice(1, 4).join(' · ')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Test Health Matrix ─────────────────────────────────────────── */}
      <Divider className="my-2" />
      <div className="w-full p-3 flex flex-col gap-3 mt-2">
        <h4 className="font-semibold text-sm text-default-600 uppercase tracking-wide flex items-center gap-2">
          <BarChart3 size={14} />
          {messages.testHealthSection}
        </h4>

        {(!healthData || healthData.runs.length === 0) && (
          <p className="text-sm text-default-400">{messages.noRunsForMatrix}</p>
        )}

        {healthData && healthData.runs.length > 0 && healthData.folders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 text-default-500 font-medium min-w-32">Folder</th>
                  {healthData.runs.map((run) => (
                    <th key={run.id} className="text-center p-2 text-default-500 font-medium min-w-20 max-w-24">
                      <div className="truncate" title={run.name}>{run.name}</div>
                      <div className="text-default-300 font-normal">{formatDate(run.updatedAt)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {healthData.folders.map((folder) => (
                  <tr key={folder.id} className="border-t-1 dark:border-neutral-700">
                    <td className="p-2 font-medium text-default-700 truncate max-w-32" title={folder.name}>
                      {folder.name}
                    </td>
                    {healthData.runs.map((run) => {
                      const cell = healthData.matrix[folder.id]?.[run.id];
                      const colorClass = cellColor(cell);
                      return (
                        <td key={run.id} className={`p-2 text-center rounded ${colorClass}`}>
                          {cell && cell.total > 0 ? (
                            <Tooltip
                              content={`${cell.passed} passed · ${cell.failed} failed · ${cell.skipped} skipped`}
                            >
                              <span className="cursor-default">
                                {cell.failed > 0
                                  ? <AlertTriangle size={12} className="inline" />
                                  : <CheckCircle2 size={12} className="inline" />
                                }
                                {' '}{cell.passed}/{cell.total}
                              </span>
                            </Tooltip>
                          ) : (
                            <span className="text-default-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Activity Log ──────────────────────────────────────────────── */}
      <Divider className="my-2" />
      <div className="w-full p-3 flex flex-col gap-3 mt-2 mb-8">
        <h4 className="font-semibold text-sm text-default-600 uppercase tracking-wide flex items-center gap-2">
          <Clock size={14} />
          {messages.activitySection}
        </h4>

        {syncLogs.length === 0 && (
          <p className="text-sm text-default-400">{messages.noActivity}</p>
        )}

        <div className="flex flex-col gap-1">
          {syncLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 py-2 border-b-1 dark:border-neutral-700/50 last:border-0"
            >
              <div className="shrink-0 mt-0.5">
                {log.status === 'failed'
                  ? <AlertTriangle size={14} className="text-danger" />
                  : <CheckCircle2 size={14} className="text-success" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Chip color={logTypeColor(log.type)} variant="flat" size="sm">
                    {logTypeLabel(log.type)}
                  </Chip>
                  {log.commitSha && (
                    <span className="text-xs font-mono text-default-400">{log.commitSha.slice(0, 7)}</span>
                  )}
                  <span className="text-xs text-default-400 ml-auto">{formatDate(log.createdAt)}</span>
                </div>
                {log.description && (
                  <p className="text-xs text-default-600 mt-1">{log.description}</p>
                )}
                {log.created > 0 && (
                  <p className="text-xs text-secondary mt-0.5">
                    {messages.activityCasesCreated.replace('{count}', String(log.created))}
                  </p>
                )}
                {log.errorMessage && (
                  <p className="text-xs text-danger mt-0.5">{log.errorMessage}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
