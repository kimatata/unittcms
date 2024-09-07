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
  Steps?: StepType[];
  RunCases?: RunCaseType[];
  Attachments?: AttachmentType[];
};

type CaseStepType = {
  createdAt?: Date;
  updatedAt?: Date;
  CaseId?: number;
  StepId?: number;
  stepNo: number;
};

type StepType = {
  id: number;
  step: string;
  result: string;
  createdAt: Date;
  updatedAt: Date;
  caseSteps: CaseStepType;
  uid: string;
  editState: 'notChanged' | 'changed' | 'new' | 'deleted';
};

type RunCaseType = {
  id: number;
  runId: number;
  caseId: number;
  status: number;
  editState: 'notChanged' | 'changed' | 'new' | 'deleted';
};

type CaseAttachmentType = {
  createdAt: Date;
  updatedAt: Date;
  caseId: number;
  attachmentId: number;
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

type CasesMessages = {
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
  noCasesFound: string;
  caseTitle: string;
  caseDescription: string;
  create: string;
  pleaseEnter: string;
};

type CaseMessages = {
  backToCases: string;
  updating: string;
  update: string;
  updatedTestCase: string;
  basic: string;
  title: string;
  pleaseEnterTitle: string;
  description: string;
  testCaseDescription: string;
  priority: string;
  type: string;
  template: string;
  testDetail: string;
  preconditions: string;
  expectedResult: string;
  step: string;
  text: string;
  steps: string;
  newStep: string;
  detailsOfTheStep: string;
  deleteThisStep: string;
  insertStep: string;
  attachments: string;
  delete: string;
  download: string;
  deleteFile: string;
  clickToUpload: string;
  orDragAndDrop: string;
  maxFileSize: string;
  areYouSureLeave: string;
};

export type { CaseType, StepType, AttachmentType, CasesMessages, CaseMessages };
