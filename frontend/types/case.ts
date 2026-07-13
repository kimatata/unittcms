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
  Tags?: {
    id: number;
    name: string;
  }[];
};

type ImportCaseStepType = {
  stepNo: number;
  step: string;
  result: string;
};

type ImportCaseStatus = 'new' | 'update' | 'error';

type ImportCaseType = {
  rowNumbers: number[];
  status: ImportCaseStatus;
  errors?: string[];
  externalId?: string | null;
  module?: string | null;
  matchedCaseId?: number;
  title?: string;
  description?: string;
  priority?: number;
  type?: number;
  preConditions?: string;
  expectedResults?: string;
  automationStatus?: number;
  template?: number;
  steps?: ImportCaseStepType[];
};

type ImportSheetType = {
  sheetName: string;
  targetFolderName: string;
  summary: {
    total: number;
    new: number;
    update: number;
    failed: number;
  };
  cases: ImportCaseType[];
};

type ImportPreviewResponse = {
  multiSheet: boolean;
  sheets: ImportSheetType[];
  error?: string;
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
  commentCount?: number;
  assigneeUserId: number | null;
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
  filename: string;
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
  export: string;
  status: string;
  noCasesFound: string;
  caseTitle: string;
  caseDescription: string;
  caseTitleOrDescription: string;
  create: string;
  pleaseEnter: string;
  filter: string;
  clearAll: string;
  apply: string;
  selectPriorities: string;
  selected: string;
  type: string;
  selectTypes: string;
  casesSelected: string;
  selectAction: string;
  move: string;
  clone: string;
  casesMoved: string;
  tags: string;
  casesCloned: string;
  selectTags: string;
  import: string;
  importCases: string;
  importAvailable: string;
  downloadTemplate: string;
  clickToUpload: string;
  orDragAndDrop: string;
  maxFileSize: string;
  casesImported: string;
  createMore: string;
  importPreviewTitle: string;
  sheet: string;
  targetFolder: string;
  newCases: string;
  updateCases: string;
  failedCases: string;
  row: string;
  includeSheet: string;
  importSelected: string;
  back: string;
  noImportableCases: string;
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
  overallExpectedResult: string;
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
  tags: string;
  createTag: string;
  maxTagsLimit: string;
  tagAlreadyExists: string;
  tagCreatedAndAdded: string;
  errorCreatingTag: string;
  errorUpdatingTestCase: string;
  searchOrCreateTag: string;
  noTagsSelected: string;
};

export type {
  CaseType,
  StepType,
  AttachmentType,
  CasesMessages,
  CaseMessages,
  ImportSheetType,
  ImportCaseType,
  ImportPreviewResponse,
};
