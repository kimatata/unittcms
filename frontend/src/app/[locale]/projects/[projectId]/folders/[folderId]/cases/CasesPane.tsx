"use client";
import { useEffect, useState } from "react";
import TestCaseTable from "./TestCaseTable";
import { fetchCases, createCase, deleteCase, deleteCases } from "./caseControl";

type Props = {
  projectId: string;
  folderId: string;
  locale: string;
};

export default function CasesPane({ projectId, folderId, locale }: Props) {
  const [cases, setCases] = useState([]);
  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const data = await fetchCases(folderId);
        setCases(data);
      } catch (error: any) {
        console.error("Error in effect:", error.message);
      }
    }

    fetchDataEffect();
  }, []);

  const handleCreateCase = async (folderId: string) => {
    const newCase = await createCase(folderId);
    const updateCases = [...cases];
    updateCases.push(newCase);
    setCases(updateCases);
  };

  const handleDeleteCase = async (caseId: number) => {
    await deleteCase(caseId);
    const data = await fetchCases(folderId);
    setCases(data);
  };

  const handleDeleteCases = async (deleteCaseIds: string[]) => {
    await deleteCases(deleteCaseIds);
    const data = await fetchCases(folderId);
    setCases(data);
  };

  return (
    <>
      <TestCaseTable
        projectId={projectId}
        cases={cases}
        onCreateCase={() => handleCreateCase(folderId)}
        onDeleteCase={handleDeleteCase}
        onDeleteCases={handleDeleteCases}
        locale={locale}
      />
    </>
  );
}
