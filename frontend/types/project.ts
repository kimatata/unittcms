import { FolderType } from './folder';
import { RunType } from './run';

export type ProjectType = {
  id: number;
  name: string;
  detail: string;
  isPublic: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
  Folders: FolderType[]; // additional property
  Runs: RunType[]; // additional property
};

export type ProjectDialogMessages = {
  project: string;
  projectName: string;
  projectDetail: string;
  public: string;
  private: string;
  ifYouMakePublic: string;
  close: string;
  create: string;
  update: string;
  pleaseEnter: string;
};

export type ProjectsMessages = {
  projectList: string;
  newProject: string;
  id: string;
  publicity: string;
  public: string;
  private: string;
  name: string;
  detail: string;
  lastUpdate: string;
  noProjectsFound: string;
  actions: string;
  editProject: string;
};

export type ProjectMessages = {
  toggleSidebar: string;
  home: string;
  testCases: string;
  testRuns: string;
  members: string;
  settings: string;
  automation: string;
  integrations: string;
  monitor: string;
};

export type MonitorMessages = {
  monitor: string;
  // Health bar
  healthCoverage: string;
  healthLastRun: string;
  healthOpenGaps: string;
  healthCommitsSynced: string;
  // Source repo config
  sourceRepoSection: string;
  sourceRepoOwner: string;
  sourceRepoName: string;
  sourceRepoBranch: string;
  sourceRepoOwnerPlaceholder: string;
  sourceRepoNamePlaceholder: string;
  sourceRepoBranchPlaceholder: string;
  autoAnalyzeCommits: string;
  autoAnalyzeCommitsDescription: string;
  saveSourceRepo: string;
  savingSourceRepo: string;
  saveSourceRepoSuccess: string;
  saveSourceRepoError: string;
  sourceRepoConnected: string;
  sourceRepoNotConnected: string;
  // Commit sync
  syncCommits: string;
  syncingCommits: string;
  syncCommitsSuccess: string;
  syncCommitsError: string;
  syncCommitsResult: string;
  // Commit timeline
  commitTimelineSection: string;
  noCommitsSynced: string;
  analyzeCommit: string;
  analyzingCommit: string;
  analyzeCommitSuccess: string;
  analyzeCommitError: string;
  commitStatusNew: string;
  commitStatusAnalyzing: string;
  commitStatusDone: string;
  commitStatusFailed: string;
  viewTestCommit: string;
  generatedCases: string;
  // Test health matrix
  testHealthSection: string;
  noRunsForMatrix: string;
  // Activity log
  activitySection: string;
  noActivity: string;
  activityCommitSync: string;
  activityAiAnalysis: string;
  activityTestSync: string;
  activityWebhook: string;
  activityCasesCreated: string;
};

export type AutomationConfigType = {
  id: number;
  projectId: number;
  provider: 'gitlab' | 'github';
  gitlabUrl: string;
  gitlabToken: string;
  gitlabNamespace: string | null;
  repoName: string | null;
  repoUrl: string | null;
  repoId: number | null;
  automationTool: string;
  automationLanguage: string;
  autoFixEnabled: boolean;
  sourceRepoOwner: string | null;
  sourceRepoName: string | null;
  sourceRepoBranch: string;
  webhookSecret: string | null;
  autoAnalyzeCommits: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SourceCommitStatus = 'new' | 'analyzing' | 'analyzed' | 'done' | 'failed';

export type SourceCommitType = {
  id: number;
  automationConfigId: number;
  sha: string;
  message: string | null;
  author: string | null;
  committedAt: string | null;
  status: SourceCommitStatus;
  aiSummary: string | null;
  generatedTestCaseIds: string | null;
  testCommitSha: string | null;
  createdAt: string;
};

export type SyncLogType = {
  id: number;
  automationConfigId: number;
  type: 'commit_sync' | 'ai_analysis' | 'test_sync' | 'webhook';
  commitSha: string | null;
  description: string | null;
  created: number;
  updated: number;
  orphaned: number;
  status: 'success' | 'failed';
  errorMessage: string | null;
  createdAt: string;
};

export type TestHealthCell = { total: number; passed: number; failed: number; skipped: number };
export type TestHealthRun = { id: number; name: string; status: number; updatedAt: string };
export type TestHealthFolder = { id: number; name: string };
export type TestHealthData = {
  runs: TestHealthRun[];
  folders: TestHealthFolder[];
  matrix: Record<number, Record<number, TestHealthCell>>;
};

export type AutomationMessages = {
  automation: string;
  repoName: string;
  automationTool: string;
  automationLanguage: string;
  saveConfig: string;
  generateProject: string;
  generating: string;
  repoUrl: string;
  connected: string;
  notConnected: string;
  toolPlaywright: string;
  toolCypress: string;
  toolPytest: string;
  langTypescript: string;
  langJavascript: string;
  langPython: string;
  successSaved: string;
  successGenerated: string;
  errorSaved: string;
  errorGenerated: string;
  openRepo: string;
  repoNamePlaceholder: string;
  provider: string;
  providerGitlab: string;
  providerGithub: string;
  ciSection: string;
  runTests: string;
  triggering: string;
  ciStatus: string;
  runStatusQueued: string;
  runStatusInProgress: string;
  runStatusSuccess: string;
  runStatusFailure: string;
  runStatusCancelled: string;
  runStatusNone: string;
  viewRun: string;
  successTriggered: string;
  errorTriggered: string;
  refreshStatus: string;
  repairCoreFiles: string;
  repairing: string;
  successRepaired: string;
  errorRepaired: string;
  errorsSection: string;
  fetchErrors: string;
  fetchingErrors: string;
  noErrorsFound: string;
  fixWithAi: string;
  fixing: string;
  fixSuccess: string;
  fixError: string;
  viewCommit: string;
  autoFixRunning: string;
  noAnthropicKey: string;
  // Implemented tests panel
  implementedSection: string;
  implementedCount: string;
  noImplementedTests: string;
  // Run mode selector
  runModeAll: string;
  runModeSelect: string;
  runModeTestRun: string;
  runSelectedCount: string;
  selectTestRunPlaceholder: string;
  implementedCountInRun: string;
  // Sync
  syncTests: string;
  syncing: string;
  syncSuccess: string;
  syncError: string;
  syncResult: string;
  viewCommitSync: string;
  openInRepo: string;
};
