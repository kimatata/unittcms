import { FolderType } from './folder';
import { RunType } from './run';

export type ProjectType = {
  id: number;
  name: string;
  detail: string;
  createdAt: string;
  updatedAt: string;
  Folders: FolderType[]; // additional property
  Runs: RunType[]; // additional property
};

export type ProjectsMessages = {
  projectList: string;
  newProject: string;
  editProject: string;
  deleteProject: string;
  id: string;
  name: string;
  detail: string;
  lastUpdate: string;
  actions: string;
  projectName: string;
  projectDetail: string;
  close: string;
  create: string;
  update: string;
  pleaseEnter: string;
  noProjectsFound: string;
};

export type ProjectMessages = {
  home: string;
  testCases: string;
  testRuns: string;
};
