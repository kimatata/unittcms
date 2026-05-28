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
  createdAt: string;
  updatedAt: string;
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
};
