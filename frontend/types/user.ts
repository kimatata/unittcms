export type UserType = {
  id: number | null;
  email: string;
  password: string;
  username: string;
  role: number;
  avatarPath: string;
} | null;

export type TokenProps = {
  children?: React.ReactNode;
};

export type TokenType = {
  token: {
    access_token: string;
    user: UserType;
  };
  setToken: () => {};
};

export type AuthMessages = {
  title: string;
  linkTitle: string;
  submitTitle: string;
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
