'use client';
import { useState, useEffect, useContext, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TestCaseTable from './TestCaseTable';
import CaseDialog from './CaseDialog';
import CaseMoveDialog from './CaseMoveDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { TokenContext } from '@/utils/TokenProvider';
import { fetchCases, createCase, deleteCases, exportCases } from '@/utils/caseControl';
import { CaseType, CasesMessages } from '@/types/case';
import { PriorityMessages } from '@/types/priority';
import { TestTypeMessages } from '@/types/testType';
import { LocaleCodeType } from '@/types/locale';
import { logError } from '@/utils/errorHandler';
import { parseQueryParam } from '@/utils/parseQueryParam';
import { onMoveEvent } from '@/utils/testCaseMoveEvent';

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
  const [titleFilter, setTitleFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<number[]>([]);
  const [typeFilter, setTypeFilter] = useState<number[]>([]);
  const [tagFilter, setTagFilter] = useState<number[]>([]);
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  const [deleteCaseIds, setDeleteCaseIds] = useState<number[]>([]);

  const context = useContext(TokenContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateUrlParams = (updates: { title?: string; priority?: number[]; type?: number[]; tag?: number[] }) => {
    const currentParams = new URLSearchParams(searchParams.toString());

    if (updates.title) {
      currentParams.set('title', updates.title);
    } else {
      currentParams.delete('title');
    }

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

    if (updates.tag && updates.tag.length > 0) {
      currentParams.set('tag', updates.tag.join(','));
    } else {
      currentParams.delete('tag');
    }

    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    router.push(newUrl, { scroll: false });
  };

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) return;

      const titleParam = searchParams.get('title') || '';
      const priorityParam = parseQueryParam(searchParams.get('priority'));
      const typeParam = parseQueryParam(searchParams.get('type'));
      const tagParam = parseQueryParam(searchParams.get('tag'));

      setTitleFilter(titleParam);
      setPriorityFilter(priorityParam);
      setTypeFilter(typeParam);
      setTagFilter(tagParam);

      try {
        const data = await fetchCases(
          context.token.access_token,
          Number(folderId),
          titleParam || undefined,
          priorityParam.length > 0 ? priorityParam : undefined,
          typeParam.length > 0 ? typeParam : undefined,
          tagParam.length > 0 ? tagParam : undefined
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

  const handleFilterChange = (title: string, priorities: number[], types: number[], tag: number[]) => {
    setTitleFilter(title);
    setPriorityFilter(priorities);
    setTypeFilter(types);
    setTagFilter(tag);
    updateUrlParams({ title: title, priority: priorities, type: types, tag: tag });
  };

  // **************************************************************************
  // Move/Clone cases
  // **************************************************************************
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [selectedCaseIds, setSelectedCaseIds] = useState<number[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<number | undefined>(undefined);
  const openMoveDialog = useCallback((caseIds: number[], folderId?: number) => {
    setSelectedCaseIds(caseIds);
    setTargetFolderId(folderId);
    setIsMoveDialogOpen(true);
  }, []);

  const handleMoved = () => {
    setCases((prev) => prev.filter((c) => !selectedCaseIds.includes(c.id)));
  };

  useEffect(() => {
    const unsubscribe = onMoveEvent(async (e) => {
      const { testCaseIds, targetFolderId } = e.detail;
      openMoveDialog(testCaseIds, targetFolderId);
    });
    return unsubscribe;
  }, [openMoveDialog]);

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
        activeTitleFilter={titleFilter}
        activePriorityFilters={priorityFilter}
        activeTypeFilters={typeFilter}
        activeTagFilters={tagFilter}
        messages={messages}
        priorityMessages={priorityMessages}
        testTypeMessages={testTypeMessages}
        locale={locale}
      />

      <CaseDialog isOpen={isCaseDialogOpen} onCancel={closeDialog} onSubmit={onSubmit} messages={messages} />

      <CaseMoveDialog
        isOpen={isMoveDialogOpen}
        testCaseIds={selectedCaseIds}
        projectId={projectId}
        targetFolderId={targetFolderId}
        isDisabled={!context.isProjectDeveloper(Number(projectId))}
        onCancel={() => setIsMoveDialogOpen(false)}
        onMoved={handleMoved}
        messages={messages}
        token={context.token.access_token}
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
