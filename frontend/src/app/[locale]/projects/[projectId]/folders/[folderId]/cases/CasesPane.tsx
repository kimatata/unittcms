'use client';
import { useState, useEffect, useContext } from 'react';
import TestCaseTable from './TestCaseTable';
import CaseDialog from './CaseDialog';
import { TokenContext } from '@/utils/TokenProvider';
import { fetchCases, createCase, deleteCases, exportCases } from '@/utils/caseControl';
import { CaseType, CasesMessages } from '@/types/case';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { PriorityMessages } from '@/types/priority';
import { LocaleCodeType } from '@/types/locale';
import { logError } from '@/utils/errorHandler';

type Props = {
  projectId: string;
  folderId: string;
  messages: CasesMessages;
  priorityMessages: PriorityMessages;
  locale: LocaleCodeType;
};

export default function CasesPane({ projectId, folderId, messages, priorityMessages, locale }: Props) {
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
      } catch (error: unknown) {
        logError('Error fetching cases:', error);
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
      await deleteCases(context.token.access_token, deleteCaseIds, Number(projectId));
      setCases(cases.filter((entry) => !deleteCaseIds.includes(entry.id)));
      closeDeleteConfirmDialog();
    }
  };

  const onExportCases = async (type: string) => {
    await exportCases(context.token.access_token, Number(folderId), type);
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
        onExportCases={onExportCases}
        messages={messages}
        priorityMessages={priorityMessages}
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
