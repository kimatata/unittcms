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
};

export type ProjectMessages = {
  home: string;
  testCases: string;
  testRuns: string;
  members: string;
  settings: string;
};
