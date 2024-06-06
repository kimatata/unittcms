type CaseType = {
  id: number;
  title: string;
  state: number;
  priority: number;
  type: number;
  automationStatus: number;
  description: string;
  template: number;
  preConditions: string;
  expectedResults: string;
  folderId: number;
  Steps: StepType[]; // additional property
  Attachments: AttachmentType[]; // additional property
  isIncluded: boolean; // additional property
  runStatus: number; // additional property
};

type CaseStepType = {
  createdAt: Date;
  updatedAt: Date;
  CaseId: number;
  StepId: number;
};

type StepType = {
  id: number;
  step: string;
  result: string;
  createdAt: Date;
  updatedAt: Date;
  caseSteps: CaseStepType;
};

type CaseAttachmentType = {
  createdAt: Date;
  updatedAt: Date;
  CaseId: number;
  AttachmentId: number;
};

type AttachmentType = {
  id: number;
  title: string;
  detail: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
  caseAttachments: CaseAttachmentType;
};

type CaseTypeCountType = {
  type: number;
  count: number;
};

type CasePriorityCountType = {
  priority: number;
  count: number;
};

export type CasesMessages = {
  testCaseList: string;
  id: string;
  title: string;
  priority: string;
  actions: string;
  deleteCase: string;
  close: string;
  areYouSure: string;
  delete: string;
  newTestCase: string;
  status: string;
  critical: string;
  high: string;
  medium: string;
  low: string;
  noCasesFound: string;
  caseTitle: string;
  caseDescription: string;
  create: string;
  pleaseEnter: string;
};

export type CaseMessages = {
  backToCases: string;
  updating: string;
  update: string;
  basic: string;
  title: string;
  pleaseEnterTitle: string;
  description: string;
  testCaseDescription: string;
  priority: string;
  critical: string;
  high: string;
  medium: string;
  low: string;
  type: string;
  other: string;
  security: string;
  performance: string;
  accessibility: string;
  functional: string;
  acceptance: string;
  usability: string;
  smokeSanity: string;
  compatibility: string;
  destructive: string;
  regression: string;
  automated: string;
  manual: string;
  template: string;
  testDetail: string;
  preconditions: string;
  step: string;
  text: string;
  steps: string;
  newStep: string;
  detailsOfTheStep: string;
  expectedResult: string;
  deleteThisStep: string;
  insertStep: string;
  attachments: string;
  delete: string;
  download: string;
  deleteFile: string;
  clickToUpload: string;
  orDragAndDrop: string;
  maxFileSize: string;
};

export { CaseType, StepType, AttachmentType, CaseTypeCountType, CasePriorityCountType, CasesMessages, CaseMessages };
