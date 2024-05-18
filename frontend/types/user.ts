export type UserType = {
  id: number | null;
  email: string;
  password: string;
  username: string;
  role: number;
  avatarPath: string;
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