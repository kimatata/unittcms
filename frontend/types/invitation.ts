type InvitationType = {
  id: number;
  token: string;
  projectId: number;
  role: number;
  email: string | null;
  expiresAt: string;
};

type InvitationPreviewType = {
  projectName: string;
  role: number;
  email: string | null;
  expiresAt: string;
};

type InvitationMessages = {
  invite: string;
  inviteTitle: string;
  inviteIntro: string;
  role: string;
  emailOptional: string;
  create: string;
  close: string;
  copy: string;
  shareWhatsapp: string;
  shareEmail: string;
  shareSubject: string;
  shareBody: string;
  pending: string;
  noPending: string;
  revoke: string;
  expiresOn: string;
  inviteError: string;
  roleManager: string;
  roleDeveloper: string;
  roleReporter: string;
};

type InvitationAcceptMessages = {
  title: string;
  intro: string;
  invalid: string;
  invalidDetail: string;
  joinAs: string;
  join: string;
  createAccount: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  passwordTooShort: string;
  passwordDoesNotMatch: string;
  emailTaken: string;
  acceptError: string;
  goToProject: string;
  roleManager: string;
  roleDeveloper: string;
  roleReporter: string;
};

export type { InvitationType, InvitationPreviewType, InvitationMessages, InvitationAcceptMessages };
