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

export { CaseType, StepType, AttachmentType };
