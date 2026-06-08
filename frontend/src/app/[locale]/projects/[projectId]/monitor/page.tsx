import { useTranslations } from 'next-intl';
import MonitorPage from './MonitorPage';
import { MonitorMessages } from '@/types/project';

export default function Page({ params: { projectId } }: { params: { projectId: string } }) {
  const t = useTranslations('Monitor');
  const messages: MonitorMessages = {
    monitor: t('monitor'),
    healthCoverage: t('health_coverage'),
    healthLastRun: t('health_last_run'),
    healthOpenGaps: t('health_open_gaps'),
    healthCommitsSynced: t('health_commits_synced'),
    sourceRepoSection: t('source_repo_section'),
    sourceRepoOwner: t('source_repo_owner'),
    sourceRepoName: t('source_repo_name'),
    sourceRepoBranch: t('source_repo_branch'),
    sourceRepoOwnerPlaceholder: t('source_repo_owner_placeholder'),
    sourceRepoNamePlaceholder: t('source_repo_name_placeholder'),
    sourceRepoBranchPlaceholder: t('source_repo_branch_placeholder'),
    autoAnalyzeCommits: t('auto_analyze_commits'),
    autoAnalyzeCommitsDescription: t('auto_analyze_commits_description'),
    saveSourceRepo: t('save_source_repo'),
    savingSourceRepo: t('saving_source_repo'),
    saveSourceRepoSuccess: t('save_source_repo_success'),
    saveSourceRepoError: t('save_source_repo_error'),
    sourceRepoConnected: t('source_repo_connected'),
    sourceRepoNotConnected: t('source_repo_not_connected'),
    syncCommits: t('sync_commits'),
    syncingCommits: t('syncing_commits'),
    syncCommitsSuccess: t('sync_commits_success'),
    syncCommitsError: t('sync_commits_error'),
    syncCommitsResult: t('sync_commits_result'),
    commitTimelineSection: t('commit_timeline_section'),
    noCommitsSynced: t('no_commits_synced'),
    analyzeCommit: t('analyze_commit'),
    analyzingCommit: t('analyzing_commit'),
    analyzeCommitSuccess: t('analyze_commit_success'),
    analyzeCommitError: t('analyze_commit_error'),
    commitStatusNew: t('commit_status_new'),
    commitStatusAnalyzing: t('commit_status_analyzing'),
    commitStatusDone: t('commit_status_done'),
    commitStatusFailed: t('commit_status_failed'),
    viewTestCommit: t('view_test_commit'),
    generatedCases: t('generated_cases'),
    testHealthSection: t('test_health_section'),
    noRunsForMatrix: t('no_runs_for_matrix'),
    activitySection: t('activity_section'),
    noActivity: t('no_activity'),
    activityCommitSync: t('activity_commit_sync'),
    activityAiAnalysis: t('activity_ai_analysis'),
    activityTestSync: t('activity_test_sync'),
    activityWebhook: t('activity_webhook'),
    activityCasesCreated: t('activity_cases_created'),
  };

  return <MonitorPage projectId={projectId} messages={messages} />;
}
