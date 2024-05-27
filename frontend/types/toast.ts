export type ToastProps = {
  children?: React.ReactNode;
};

export type ToastMessages = {
  needSignedIn: string;
  sessionExpired: string;
};

export type ToastContextType = {
  showToast: (text: string, mode: string) => {};
};
