'use client';
import { createContext, useState, useEffect } from 'react';
import { TokenType } from '@/types/user';
import { TokenProps } from '@/types/user';
import { useRouter, usePathname } from '@/src/navigation';

const LOCAL_STORAGE_KEY = 'testplat-auth-token';
const privatePaths = ['/account'];

function storeTokenToLocalStorage(token: TokenType) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(token));
}

function removeTokenFromLocalStorage() {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

const defaultTokenContext = {};
const TokenContext = createContext(defaultTokenContext);

const TokenProvider = ({ locale, children }: TokenProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const [token, setToken] = useState<TokenType>({
    access_token: '',
    user: null,
  });
  const tokenContext = {
    token,
    setToken,
    storeTokenToLocalStorage,
    removeTokenFromLocalStorage,
  };

  const restoreTokenFromLocalStorage = () => {
    const tokenString = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (tokenString) {
      const restoredToken = JSON.parse(tokenString);
      setToken(restoredToken);
    } else {
      checkSignInPage();
    }
  };

  const checkSignInPage = () => {
    if (
      privatePaths.some((path) => {
        return path === pathname;
      })
    ) {
      router.push(`/account/signin`, { locale: locale });
    }
  };

  useEffect(() => {
    restoreTokenFromLocalStorage();
  }, []);

  return <TokenContext.Provider value={tokenContext}>{children}</TokenContext.Provider>;
};

export { TokenContext };
export default TokenProvider;
