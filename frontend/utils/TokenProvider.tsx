'use client';
import { createContext, useState, useEffect } from 'react';
import { addToast } from '@heroui/react';
import {
  isSignedIn as tokenIsSinedIn,
  isAdmin as tokenIsAdmin,
  isProjectOnwer as tokenIsProjectOnwer,
  isProjectManager as tokenIsProjectManager,
  isProjectDeveloper as tokenIsProjectDeveloper,
  isProjectReporter as tokenIsProjectReporter,
  checkSignInPage as tokenCheckSignInPage,
  fetchMyRoles,
} from './token';
import { logError } from './errorHandler';
import { ProjectRoleType, TokenContextType, TokenType } from '@/types/user';
import { TokenProps } from '@/types/user';
import { useRouter, usePathname } from '@/src/i18n/routing';
const LOCAL_STORAGE_KEY = 'unittcms-auth-token';

function storeTokenToLocalStorage(token: TokenType) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(token));
}

function removeTokenFromLocalStorage() {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

const defaultContext = {
  token: {
    access_token: '',
    user: null,
  },
  isSignedIn: () => false,
  isAdmin: () => false,
  isProjectOwner: () => {
    return false;
  },
  isProjectManager: () => {
    return false;
  },
  isProjectDeveloper: () => {
    return false;
  },
  isProjectReporter: () => {
    return false;
  },
  refreshProjectRoles: () => {},
  setToken: () => {},
  storeTokenToLocalStorage,
  removeTokenFromLocalStorage,
};
const TokenContext = createContext<TokenContextType>(defaultContext);

const TokenProvider = ({ toastMessages, locale, children }: TokenProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const [hasRestoreFinished, setHasRestoreFinished] = useState(false);
  const [token, setToken] = useState<TokenType>({
    access_token: '',
    expires_at: 0,
    user: null,
  });
  const [projectRoles, setProjectRoles] = useState<ProjectRoleType[]>([]);

  const isSignedIn = () => {
    return tokenIsSinedIn(token);
  };

  const isAdmin = () => {
    return tokenIsAdmin(token);
  };

  const isProjectOwner = (projectId: number) => {
    return tokenIsProjectOnwer(projectRoles, projectId);
  };

  const isProjectManager = (projectId: number) => {
    return tokenIsProjectManager(projectRoles, projectId);
  };

  const isProjectDeveloper = (projectId: number) => {
    return tokenIsProjectDeveloper(projectRoles, projectId);
  };

  const isProjectReporter = (projectId: number) => {
    return tokenIsProjectReporter(projectRoles, projectId);
  };

  async function refreshProjectRoles() {
    if (!hasRestoreFinished || !token || !token.access_token) {
      return;
    }

    try {
      const data = await fetchMyRoles(token.access_token);
      setProjectRoles(data);
    } catch (error: unknown) {
      logError('Error fetching project roles', error);
    }
  }

  const tokenContext = {
    token,
    projectRoles,
    isSignedIn,
    isAdmin,
    isProjectOwner,
    isProjectManager,
    isProjectDeveloper,
    isProjectReporter,
    setToken,
    refreshProjectRoles,
    storeTokenToLocalStorage,
    removeTokenFromLocalStorage,
  };

  const restoreTokenFromLocalStorage = () => {
    const tokenString = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (tokenString) {
      const restoredToken = JSON.parse(tokenString);
      setToken(restoredToken);
    }
    setHasRestoreFinished(true);
  };

  useEffect(() => {
    restoreTokenFromLocalStorage();
  }, []);

  useEffect(() => {
    if (!hasRestoreFinished) {
      return;
    }

    const ret = tokenCheckSignInPage(token, pathname);
    if (!ret.ok) {
      if (ret.reason === 'notoken') {
        if (toastMessages) {
          addToast({
            title: 'Info',
            description: toastMessages.needSignedIn,
            color: 'danger',
          });
        }
      } else if (ret.reason === 'expired') {
        if (toastMessages) {
          addToast({
            title: 'Info',
            description: toastMessages.sessionExpired,
            color: 'danger',
          });
        }
      }

      router.push(ret.redirectPath, { locale: locale });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hasRestoreFinished]);

  useEffect(() => {
    refreshProjectRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRestoreFinished, token]);

  return <TokenContext.Provider value={tokenContext}>{children}</TokenContext.Provider>;
};

export { TokenContext };
export default TokenProvider;
