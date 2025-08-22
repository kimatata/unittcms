'use client';
import { useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TestCaseTable from './TestCaseTable';
import CaseDialog from './CaseDialog';
import { TokenContext } from '@/utils/TokenProvider';
import { fetchCases, createCase, deleteCases, exportCases } from '@/utils/caseControl';
import { CaseType, CasesMessages } from '@/types/case';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { PriorityMessages } from '@/types/priority';
import { TestTypeMessages } from '@/types/testType';
import { LocaleCodeType } from '@/types/locale';
import { logError } from '@/utils/errorHandler';

type Props = {
  projectId: string;
  folderId: string;
  messages: CasesMessages;
  priorityMessages: PriorityMessages;
  testTypeMessages: TestTypeMessages;
  locale: LocaleCodeType;
};

export default function CasesPane({
  projectId,
  folderId,
  messages,
  priorityMessages,
  testTypeMessages,
  locale,
}: Props) {
  const [cases, setCases] = useState<CaseType[]>([]);
  const context = useContext(TokenContext);
  const [isCaseDialogOpen, setIsCaseDialogOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<number[]>([]);
  const [typeFilter, setTypeFilter] = useState<number[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }

      const priorityParam = searchParams.get('priority');
      let currentPriorityFilter: number[] = [];
      if (priorityParam) {
        currentPriorityFilter = priorityParam
          .split(',')
          .map((p) => parseInt(p.trim()))
          .filter((p) => !isNaN(p));
        setPriorityFilter(currentPriorityFilter);
      } else {
        setPriorityFilter([]);
      }

      const typeParam = searchParams.get('type');
      let currentTypeFilter: number[] = [];
      if (typeParam) {
        currentTypeFilter = typeParam
          .split(',')
          .map((t) => parseInt(t.trim()))
          .filter((t) => !isNaN(t));
        setTypeFilter(currentTypeFilter);
      } else {
        setTypeFilter([]);
      }

      try {
        const data = await fetchCases(
          context.token.access_token,
          Number(folderId),
          currentPriorityFilter.length > 0 ? currentPriorityFilter : undefined,
          currentTypeFilter.length > 0 ? currentTypeFilter : undefined
        );
        setCases(data);
      } catch (error: unknown) {
        logError('Error fetching cases:', error);
      }
    }

    fetchDataEffect();
  }, [context, folderId, searchParams]);

  const closeDialog = () => {
    setIsCaseDialogOpen(false);
  };

  const onSubmit = async (title: string, description: string) => {
    const newCase = await createCase(context.token.access_token, folderId, title, description);
    setCases([...cases, newCase]);
    closeDialog();
  };

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

  const handleFilterChange = (priorities: number[], types: number[]) => {
    setPriorityFilter(priorities);
    setTypeFilter(types);

    const currentParams = new URLSearchParams(searchParams.toString());

    if (priorities.length > 0) {
      currentParams.set('priority', priorities.join(','));
    } else {
      currentParams.delete('priority');
    }

    if (types.length > 0) {
      currentParams.set('type', types.join(','));
    } else {
      currentParams.delete('type');
    }

    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    router.push(newUrl, { scroll: false });
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
        onFilterChange={handleFilterChange}
        activePriorityFilters={priorityFilter}
        activeTypeFilters={typeFilter}
        messages={messages}
        priorityMessages={priorityMessages}
        testTypeMessages={testTypeMessages}
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
