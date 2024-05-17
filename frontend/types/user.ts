export type UserType = {
  id: number | null;
  email: string;
  password: string;
  username: string;
  role: number;
  avatarPath: string;
};

export type AuthMessages = {
  signup: string;
  signin: string;
};