import { ToastMessages } from './toast';

export type UserType = {
  id: number | null;
  email: string;
  password: string;
  username: string;
  role: number;
  avatarPath: string | null;
} | null;

export type TokenProps = {
  toastMessages: ToastMessages;
  locale: string;
  children?: React.ReactNode;
};

export type TokenType = {
  access_token: string;
  expires_at: number;
  user: UserType;
};

export type TokenContextType = {
  token: {
    access_token: string;
    user: UserType;
  };
  isSignedIn: () => boolean;
  isAdmin: () => boolean;
  isProjectManager: (projectId: number) => boolean;
  isProjectDeveloper: (projectId: number) => boolean;
  setToken: (token: TokenType) => void;
  storeTokenToLocalStorage: (token: TokenType) => void;
  removeTokenFromLocalStorage: () => void;
};

export type ProjectRoleType = {
  projectId: number;
  isOwner: boolean;
  isMember: boolean;
  role: number;
};

export type AuthMessages = {
  title: string;
  linkTitle: string;
  submitTitle: string;
  signInAsGuest: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  invalidEmail: string;
  invalidPassword: string;
  usernameEmpty: string;
  passwordDoesNotMatch: string;
  EmailAlreadyExist: string;
  emailNotExist: string;
  signupError: string;
  signinError: string;
};

export type AdminMessages = {
  userManagement: string;
  avatar: string;
  id: string;
  email: string;
  username: string;
  role: string;
  noUsersFound: string;
};

export type AccountDropDownMessages = {
  account: string;
  signUp: string;
  signIn: string;
  signOut: string;
};

export type MemberType = {
  id: number | null;
  userId: number;
  projectId: number;
  role: number;
  User: UserType;
};
