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
import { parseQueryParam } from '@/utils/parseQueryParam';

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
  const [isCaseDialogOpen, setIsCaseDialogOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<number[]>([]);
  const [typeFilter, setTypeFilter] = useState<number[]>([]);
  const [queryTerm, setQueryTerm] = useState('');
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  const [deleteCaseIds, setDeleteCaseIds] = useState<number[]>([]);

  const context = useContext(TokenContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateUrlParams = (updates: {
    priority?: number[];
    type?: number[];
    q?: string;
  }) => {
    const currentParams = new URLSearchParams(searchParams.toString());

    if (updates.priority && updates.priority.length > 0) {
      currentParams.set('priority', updates.priority.join(','));
    } else {
      currentParams.delete('priority');
    }

    if (updates.type && updates.type.length > 0) {
      currentParams.set('type', updates.type.join(','));
    } else {
      currentParams.delete('type');
    }

    if (updates.q) {
      currentParams.set('q', updates.q);
    } else {
      currentParams.delete('q');
    }

    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    router.push(newUrl, { scroll: false });
  };

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) return;

      const priorityParam = parseQueryParam(searchParams.get('priority'));
      const typeParam = parseQueryParam(searchParams.get('type'));
      const queryParam = searchParams.get('q') || '';

      setPriorityFilter(priorityParam);
      setTypeFilter(typeParam);
      setQueryTerm(queryParam);

      try {
        const data = await fetchCases(
          context.token.access_token,
          Number(folderId),
          priorityParam.length > 0 ? priorityParam : undefined,
          typeParam.length > 0 ? typeParam : undefined,
          queryParam || undefined
        );
        setCases(data);
      } catch (error: unknown) {
        logError('Error fetching cases:', error);
      }
    }

    fetchDataEffect();
  }, [context, folderId, searchParams]);

  const closeDialog = () => setIsCaseDialogOpen(false);

  const onSubmit = async (title: string, description: string) => {
    const newCase = await createCase(context.token.access_token, folderId, title, description);
    setCases([...cases, newCase]);
    closeDialog();
  };

  const closeDeleteConfirmDialog = () => {
    setIsDeleteConfirmDialogOpen(false);
    setDeleteCaseIds([]);
  };

  const onDeleteCase = (deleteCaseId: number) => {
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
    updateUrlParams({ priority: priorities, type: types, q: queryTerm });
  };

  const handleQueryChange = (q: string) => {
    setQueryTerm(q);
    updateUrlParams({ priority: priorityFilter, type: typeFilter, q });
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
        onQueryChange={handleQueryChange}
        activePriorityFilters={priorityFilter}
        activeTypeFilters={typeFilter}
        messages={messages}
        priorityMessages={priorityMessages}
        testTypeMessages={testTypeMessages}
        locale={locale}
        queryTerm={queryTerm}
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