'use client';
import { useState, useEffect, useContext } from 'react';
import { TokenContext } from '@/utils/TokenProvider';
import TestCaseTable from './TestCaseTable';
import { fetchCases, createCase, deleteCases } from '@/utils/caseControl';
import { CaseType, CasesMessages } from '@/types/case';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import CaseDialog from './CaseDialog';

type Props = {
  projectId: string;
  folderId: string;
  messages: CasesMessages;
  locale: string;
};

export default function CasesPane({ projectId, folderId, messages, locale }: Props) {
  const [cases, setCases] = useState<CaseType[]>([]);
  const context = useContext(TokenContext);
  const [isCaseDialogOpen, setIsCaseDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }
      try {
        const data = await fetchCases(context.token.access_token, Number(folderId));
        setCases(data);
      } catch (error: any) {
        console.error('Error in effect:', error.message);
      }
    }

    fetchDataEffect();
  }, [context, folderId]);

  const closeDialog = () => {
    setIsCaseDialogOpen(false);
  };

  const onSubmit = async (title: string, description: string) => {
    const newCase = await createCase(context.token.access_token, folderId, title, description);
    setCases([...cases, newCase]);
    closeDialog();
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
        isDisabled={!context.isProjectDeveloper(Number(projectId))}
        cases={cases}
        onCreateCase={() => setIsCaseDialogOpen(true)}
        onDeleteCase={onDeleteCase}
        onDeleteCases={onDeleteCases}
        messages={messages}
        locale={locale}
      />

      <CaseDialog isOpen={isCaseDialogOpen} onCancel={closeDialog} onSubmit={onSubmit} messages={messages} />

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
