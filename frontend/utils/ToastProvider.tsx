import { createContext } from 'react';
import { ToastContextType, ToastProps } from '@/types/toast';

// TODO Temporary use until NextUI's Toast is released.
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const defaultContext = {
  showToast: (text: string, mode: string) => {},
};
const ToastContext = createContext<ToastContextType>(defaultContext);

const ToastProvider = ({ children }: ToastProps) => {
  const showToast = (text: string, mode: string) => {
    if (mode === 'error') {
      toast.error(text);
    } else {
      toast(text, { theme: 'light' });
    }
  };

  const toastContext = {
    showToast,
  };

  return (
    <ToastContext.Provider value={toastContext}>
      <ToastContainer position="bottom-right" hideProgressBar={true} theme="colored" />
      {children}
    </ToastContext.Provider>
  );
};

export { ToastContext };
export default ToastProvider;
