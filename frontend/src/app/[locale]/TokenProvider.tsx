"use client";
import { createContext, useState, useEffect } from "react";
import { TokenType } from "@/types/user";
import { TokenProps } from "@/types/user";

const LOCAL_STORAGE_KEY = "testplat-auth-token";

function storeTokenToLocalStorage(token: TokenType) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(token));
}

function removeTokenFromLocalStorage() {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

const defaultTokenContext = {};
const TokenContext = createContext(defaultTokenContext);

const TokenProvider = ({ children }: TokenProps) => {
  const [token, setToken] = useState<TokenType>({
    access_token: "",
    user: null,
  });
  const tokenContext = {
    token,
    setToken,
    storeTokenToLocalStorage,
    removeTokenFromLocalStorage,
  };

  useEffect(() => {
    const restoreTokenFromLocalStorage = () => {
      const tokenString = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (tokenString) {
        setToken(JSON.parse(tokenString));
      }
    };
    restoreTokenFromLocalStorage();
  }, []);

  return (
    <TokenContext.Provider value={tokenContext}>
      {children}
    </TokenContext.Provider>
  );
};

export { TokenContext };
export default TokenProvider;
