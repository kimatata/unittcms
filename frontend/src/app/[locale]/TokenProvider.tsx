"use client";
import { createContext, useState } from "react";
import { TokenType, UserType } from "@/types/user";
import { TokenProps } from "@/types/user";

const defaultTokenContext = {
  token: null,
  setUser: (token: TokenType) => {},
};
const TokenContext = createContext(defaultTokenContext);

const TokenProvider = ({ children }: TokenProps) => {
  const [token, setToken] = useState<TokenType>(null);
  const tokenContext = {
    token,
    setToken,
  };

  return (
    <TokenContext.Provider value={tokenContext}>{children}</TokenContext.Provider>
  );
};

export { TokenContext };
export default TokenProvider;
