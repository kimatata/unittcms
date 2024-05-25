'use client';
import { createContext, useState, useEffect } from 'react';
import { TokenContextType, TokenType } from '@/types/user';
import { TokenProps } from '@/types/user';
import { useRouter, usePathname } from '@/src/navigation';
const LOCAL_STORAGE_KEY = 'testplat-auth-token';
const privatePaths = ['/account', '/projects'];

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
  setToken: (token: TokenType) => {},
  storeTokenToLocalStorage,
  removeTokenFromLocalStorage,
};
const TokenContext = createContext<TokenContextType>(defaultContext);

const TokenProvider = ({ locale, children }: TokenProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const [hasRestoreFinished, setHasRestoreFinished] = useState(false);
  const [token, setToken] = useState<TokenType>({
    access_token: '',
    expires_at: 0,
    user: null,
  });

  const isSignedIn = () => {
    // check token
    if (token && token.user && token.user.username) {
      // check expire date
      if (Date.now() < token.expires_at) {
        return true;
      }
    }

    return false;
  };

  const tokenContext = {
    token,
    isSignedIn,
    setToken,
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
    const isPrivatePath = () => {
      return privatePaths.some((path) => {
        return path === pathname;
      });
    };

    const checkSignInPage = () => {
      if (!hasRestoreFinished) {
        return;
      }
      if (isPrivatePath() && !isSignedIn()) {
        router.push(`/account/signin`, { locale: locale });
      }
    };

    checkSignInPage();
  }, [pathname, hasRestoreFinished]);

  return <TokenContext.Provider value={tokenContext}>{children}</TokenContext.Provider>;
};

export { TokenContext };
export default TokenProvider;
