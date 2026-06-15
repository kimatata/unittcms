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
  sprint: string;
};

// ── Sprint Flow types ──────────────────────────────────────────────────────────

export type SprintBranchInfo = {
  name: string;
  sha: string;
  lastCommitAuthor: string | null;
  lastCommitAt: string | null;
  ticketId: string | null;
  prNumber: number | null;
  prTitle: string | null;
  prTargetBranch: string | null;
  prState: 'open' | 'merged' | 'closed' | null;
  prUrl: string | null;
};

export type SprintFlowStatus = 'active' | 'draft' | 'testing' | 'done' | 'archived';

export type SprintFlow = {
  id: number;
  automationConfigId: number;
  title: string;
  baseBranch: string;
  versionBranch: string | null;
  jiraSprintId: string | null;
  jiraSprintTitle: string | null;
  testRunId: number | null;
  status: SprintFlowStatus;
  branchSnapshot: SprintBranchInfo[];
  nodePositions: Record<string, { x: number; y: number }>;
  testPlanDraft: SprintDraftFolder[] | null;
  generationPrompt: string | null;
  generationLogs: SprintGenerationLogEntry[];
  createdAt: string;
  updatedAt: string;
};

export type SprintDraftCase = {
  title: string;
  steps: string[];
  expectedResult: string;
};

export type SprintDraftFolder = {
  name: string;
  cases: SprintDraftCase[];
};

export type SprintGenerationLogEntry = {
  task: string;
  status: 'running' | 'done' | 'failed';
  output: string;
  durationMs: number;
  ts: number;
};

export type SprintDetectResult = {
  featureBranches: SprintBranchInfo[];
  newBranchCount: number;
  newBranches: string[];
  detectedVersionBranch: string | null;
  hasNewBranches: boolean;
};

export type SprintConfig = {
  automationConfigId: number;
  keyBranchPatterns: string[];
  sprintBranchPattern: string | null;
  jiraBaseUrl: string | null;
  jiraProjectKey: string | null;
  branchTicketRegex: string;
  sourceBranch: string | null;
  deploymentFlow: string | null;
};

export type SprintMessages = {
  sprint: string;
  newSprintFlow: string;
  startSprintFlow: string;
  startSprint: string;
  startSprintTitle: string;
  sprintTitle: string;
  sprintTitlePlaceholder: string;
  baseBranch: string;
  versionBranch: string;
  versionBranchPlaceholder: string;
  cancel: string;
  start: string;
  starting: string;
  detectionBanner: string;
  detectionBannerSingle: string;
  dismiss: string;
  noFlows: string;
  noFlowsDesc: string;
  featureBranches: string;
  mergedBranches: string;
  pendingBranches: string;
  allMerged: string;
  generateTestPlan: string;
  generateTestPlanDesc: string;
  generationPipelineTitle: string;
  promptLabel: string;
  sendToClaude: string;
  sendingToClaude: string;
  testPlanReady: string;
  testPlanDraft: string;
  reviewTestPlan: string;
  existingTests: string;
  newTests: string;
  saveAsDraft: string;
  approveAndAdd: string;
  approving: string;
  approveSuccess: string;
  approveError: string;
  draftSaved: string;
  testSuite: string;
  noSteps: string;
  addCase: string;
  deleteCase: string;
  addFolder: string;
  deleteFolder: string;
  configTitle: string;
  keyBranchPatterns: string;
  branchTicketRegex: string;
  saveConfig: string;
  configSaved: string;
  openInGit: string;
  ciPassing: string;
  ciFailing: string;
  ciUnknown: string;
  prOpen: string;
  prMerged: string;
  prClosed: string;
  noPR: string;
  loadingBoard: string;
  refreshBoard: string;
  sprintList: string;
  newSprint: string;
  statusActive: string;
  statusDraft: string;
  statusTesting: string;
  statusDone: string;
  statusArchived: string;
  branchCount: string;
  detectionSettings: string;
  keyBranchPatternsDesc: string;
  branchTicketRegexDesc: string;
  setupWizardTitle: string;
  setupWizardSubtitle: string;
  deploymentFlowLabel: string;
  flowGitflow: string;
  flowGitflowDesc: string;
  flowGithubFlow: string;
  flowGithubFlowDesc: string;
  flowTrunk: string;
  flowTrunkDesc: string;
  flowCustom: string;
  flowCustomDesc: string;
  sourceBranchLabel: string;
  sourceBranchDesc: string;
  sourceBranchPlaceholder: string;
  saveFlowSetup: string;
  savingFlowSetup: string;
  setupNoSourceRepo: string;
  next: string;
  back: string;
  stepOfSteps: string;
};

export type MonitorMessages = {
  monitor: string;
  testHealthSection: string;
  noRunsForMatrix: string;
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
  sourceProvider: string | null;
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
export type TestHealthRun = { id: number; name: string; state: number; updatedAt: string };
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
  testRepoSection: string;
};
