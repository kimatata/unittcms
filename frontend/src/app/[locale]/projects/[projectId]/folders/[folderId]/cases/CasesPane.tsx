'use client';
import { useState, useEffect, useContext } from 'react';
import { TokenContext } from '@/utils/TokenProvider';
import TestCaseTable from './TestCaseTable';
import { fetchCases, createCase, deleteCases } from './caseControl';
import { CaseType, CasesMessages } from '@/types/case';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

type Props = {
  projectId: string;
  folderId: string;
  messages: CasesMessages;
  locale: string;
};

export default function CasesPane({ projectId, folderId, messages, locale }: Props) {
  const [cases, setCases] = useState<CaseType[]>([]);
  const context = useContext(TokenContext);

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }
      try {
        const data = await fetchCases(context.token.access_token, folderId);
        setCases(data);
      } catch (error: any) {
        console.error('Error in effect:', error.message);
      }
    }

    fetchDataEffect();
  }, [context, folderId]);

  const handleCreateCase = async (folderId: string) => {
    const newCase = await createCase(context.token.access_token, folderId);
    const updateCases = [...cases];
    updateCases.push(newCase);
    setCases(updateCases);
  };

  // Delete confirm dialog
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  const [deleteCaseIds, setDeleteCaseIds] = useState<number[]>([]);
  const closeDeleteConfirmDialog = () => {
    setIsDeleteConfirmDialogOpen(false);
    setDeleteCaseIds([]);
  };

  const onDeleteCase = async (deleteCaseId: number) => {
    setDeleteCaseIds([deleteCaseId]);
    setIsDeleteConfirmDialogOpen(true);
  };

  const onDeleteCases = (deleteCaseIds: number[]) => {
    setDeleteCaseIds(deleteCaseIds);
    setIsDeleteConfirmDialogOpen(true);
  };

  const onConfirm = async () => {
    if (deleteCaseIds.length > 0) {
      await deleteCases(context.token.access_token, deleteCaseIds, projectId);
      setCases(cases.filter((entry) => !deleteCaseIds.includes(entry.id)));
      closeDeleteConfirmDialog();
    }
  };

  return (
    <>
      <TestCaseTable
        projectId={projectId}
        cases={cases}
        onCreateCase={() => handleCreateCase(folderId)}
        onDeleteCase={onDeleteCase}
        onDeleteCases={onDeleteCases}
        messages={messages}
        locale={locale}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteConfirmDialogOpen}
        onCancel={closeDeleteConfirmDialog}
        onConfirm={onConfirm}
        closeText={messages.close}
        confirmText={messages.areYouSure}
        deleteText={messages.delete}
      />
    </>
  );
}
