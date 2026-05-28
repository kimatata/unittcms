'use client';
import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
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
    expires_at: 0,
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

  const isSignedIn = useCallback(() => tokenIsSinedIn(token), [token]);

  const isAdmin = useCallback(() => tokenIsAdmin(token), [token]);

  const isProjectOwner = useCallback(
    (projectId: number) => tokenIsProjectOnwer(projectRoles, projectId),
    [projectRoles],
  );

  const isProjectManager = useCallback(
    (projectId: number) => tokenIsProjectManager(projectRoles, projectId),
    [projectRoles],
  );

  const isProjectDeveloper = useCallback(
    (projectId: number) => tokenIsProjectDeveloper(projectRoles, projectId),
    [projectRoles],
  );

  const isProjectReporter = useCallback(
    (projectId: number) => tokenIsProjectReporter(projectRoles, projectId),
    [projectRoles],
  );

  const refreshProjectRoles = useCallback(
    async function () {
      if (!hasRestoreFinished || !token || !token.access_token) {
        return;
      }

      try {
        const data = await fetchMyRoles(token.access_token);
        setProjectRoles(data);
      } catch (error: unknown) {
        logError('Error fetching project roles', error);
      }
    },
    [hasRestoreFinished, token],
  );

  const tokenContext = useMemo(
    () => ({
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
    }),
    [
      token,
      projectRoles,
      isSignedIn,
      isAdmin,
      isProjectOwner,
      isProjectManager,
      isProjectDeveloper,
      isProjectReporter,
      refreshProjectRoles,
    ],
  );

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
            title: 'Error',
            description: toastMessages.needSignedIn,
            color: 'danger',
          });
        }
      } else if (ret.reason === 'expired') {
        if (toastMessages) {
          addToast({
            title: 'Error',
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
