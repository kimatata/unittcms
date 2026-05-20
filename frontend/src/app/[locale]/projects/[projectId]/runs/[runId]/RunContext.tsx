'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { CaseType } from '@/types/case';

type Labels = {
  selected: string;
  noCasesFound: string;
};

type RunContextType = {
  includedCases: CaseType[];
  setIncludedCases: (cases: CaseType[]) => void;
  labels: Labels;
};

const RunContext = createContext<RunContextType>({
  includedCases: [],
  setIncludedCases: () => {},
  labels: { selected: '', noCasesFound: '' },
});

export function RunContextProvider({ children, labels }: { children: ReactNode; labels: Labels }) {
  const [includedCases, setIncludedCases] = useState<CaseType[]>([]);
  return <RunContext.Provider value={{ includedCases, setIncludedCases, labels }}>{children}</RunContext.Provider>;
}

export function useRunContext() {
  return useContext(RunContext);
}
