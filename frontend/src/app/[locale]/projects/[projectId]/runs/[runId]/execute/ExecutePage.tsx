'use client';
import { useState, useEffect, useContext, useCallback } from 'react';
import { Button, Badge, Tooltip } from '@heroui/react';
import { ArrowLeft, Save, Folder, FolderOpen } from 'lucide-react';
import { addToast } from '@heroui/react';
import { useRouter } from '@/src/i18n/routing';
import { TokenContext } from '@/utils/TokenProvider';
import { fetchRun, fetchProjectCases, updateRunCases, changeStatus } from '../../runsControl';
import { fetchFolders } from '../../../folders/foldersControl';
import { buildFolderTree } from '@/utils/buildFolderTree';
import { testRunCaseStatus } from '@/config/selection';
import { CaseType } from '@/types/case';
import { RunType, RunStatusCountType, ExecuteMessages } from '@/types/run';
import { TestRunCaseStatusMessages, TestRunCaseStatusUidType } from '@/types/status';
import { TreeNodeData } from '@/types/folder';
import { logError } from '@/utils/errorHandler';
import { useFormGuard } from '@/utils/formGuard';

type Props = {
  projectId: string;
  runId: string;
  locale: string;
  messages: ExecuteMessages;
  testRunCaseStatusMessages: TestRunCaseStatusMessages;
};

const STATUS_KEYS: Record<string, number> = {
  u: 0, U: 0,
  p: 1, P: 1,
  f: 2, F: 2,
  r: 3, R: 3,
  s: 4, S: 4,
};

// Returns cases in tree-traversal order (depth-first) for keyboard indexing
function flattenCasesFromTree(nodes: TreeNodeData[], casesByFolder: Map<number, CaseType[]>): CaseType[] {
  const result: CaseType[] = [];
  function traverse(nodeList: TreeNodeData[]) {
    for (const node of nodeList) {
      const folderId = parseInt(node.id);
      result.push(...(casesByFolder.get(folderId) ?? []));
      if (node.children?.length) traverse(node.children);
    }
  }
  traverse(nodes);
  return result;
}

// Returns true if this folder or any descendant has at least one included case
function hasCasesInSubtree(node: TreeNodeData, casesByFolder: Map<number, CaseType[]>): boolean {
  if ((casesByFolder.get(parseInt(node.id)) ?? []).length > 0) return true;
  return (node.children ?? []).some((child) => hasCasesInSubtree(child, casesByFolder));
}

export default function ExecutePage({
  projectId,
  runId,
  locale,
  messages,
  testRunCaseStatusMessages,
}: Props) {
  const tokenContext = useContext(TokenContext);
  const router = useRouter();

  const [run, setRun] = useState<RunType | null>(null);
  const [statusCounts, setStatusCounts] = useState<RunStatusCountType[]>([]);
  const [cases, setCases] = useState<CaseType[]>([]);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useFormGuard(isDirty, messages.areYouSureLeave);

  const includedCases = cases.filter(
    (c) => c.RunCases && c.RunCases.length > 0 && c.RunCases[0].editState !== 'deleted'
  );

  // Group included cases by folderId
  const casesByFolder = new Map<number, CaseType[]>();
  includedCases.forEach((c) => {
    const existing = casesByFolder.get(c.folderId) ?? [];
    existing.push(c);
    casesByFolder.set(c.folderId, existing);
  });

  // Flat ordered list of cases following tree traversal — used for keyboard nav
  const orderedCases = flattenCasesFromTree(treeData, casesByFolder);

  useEffect(() => {
    if (!tokenContext.isSignedIn()) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        const jwt = tokenContext.token.access_token;
        const [runData, foldersData, casesData] = await Promise.all([
          fetchRun(jwt, Number(runId)),
          fetchFolders(jwt, Number(projectId)),
          fetchProjectCases(jwt, Number(projectId), Number(runId)),
        ]);

        setRun(runData.run);
        setStatusCounts(runData.statusCounts);
        setTreeData(buildFolderTree(foldersData));

        const processed: CaseType[] = casesData.map((c: CaseType) => {
          if (c.RunCases && c.RunCases.length > 0) {
            c.RunCases[0].editState = 'notChanged';
          }
          return c;
        });
        setCases(processed);
      } catch (error: unknown) {
        logError('Error loading execute page', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenContext.isSignedIn()]);

  const handleStatusChange = useCallback(
    (index: number, newStatus: number) => {
      const target = orderedCases[index];
      if (!target) return;
      setIsDirty(true);
      setCases((prev) => changeStatus(target.id, newStatus, prev));
    },
    [orderedCases]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (orderedCases.length === 0) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.target instanceof HTMLElement && e.target.isContentEditable) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(orderedCases.length - 1, i + 1));
      } else if (STATUS_KEYS[e.key] !== undefined) {
        handleStatusChange(focusedIndex, STATUS_KEYS[e.key]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [orderedCases.length, focusedIndex, handleStatusChange]);

  const onSave = async () => {
    setIsSaving(true);
    try {
      await updateRunCases(tokenContext.token.access_token, Number(runId), cases);

      const refreshed = await fetchRun(tokenContext.token.access_token, Number(runId));
      setStatusCounts(refreshed.statusCounts);

      setCases((prev) =>
        prev.map((c) => {
          if (c.RunCases && c.RunCases.length > 0 && c.RunCases[0].editState === 'changed') {
            return { ...c, RunCases: [{ ...c.RunCases[0], editState: 'notChanged' }] };
          }
          return c;
        })
      );

      setIsDirty(false);
      addToast({ title: 'Success', description: messages.saved, color: 'success' });
    } catch (error: unknown) {
      logError('Error saving run cases', error);
      addToast({ title: 'Error', description: 'Failed to save', color: 'danger' });
    } finally {
      setIsSaving(false);
    }
  };

  // Progress bar
  const total = includedCases.length;
  const statusCountMap = new Map<number, number>();
  statusCounts.forEach((sc) => statusCountMap.set(sc.status, sc.count));

  // ── Recursive folder renderer ──────────────────────────────────────────────
  function renderFolderNode(node: TreeNodeData, depth: number): React.ReactNode {
    if (!hasCasesInSubtree(node, casesByFolder)) return null;

    const folderId = parseInt(node.id);
    const folderCases = casesByFolder.get(folderId) ?? [];
    const hasChildren = (node.children ?? []).some((child) => hasCasesInSubtree(child, casesByFolder));
    const indent = depth * 16;

    return (
      <div key={node.id}>
        {/* Folder header */}
        <div
          className="flex items-center gap-2 py-2 border-b border-divider bg-default-50 dark:bg-neutral-800/50 sticky top-0 z-10"
          style={{ paddingLeft: `${indent + 12}px`, paddingRight: '12px' }}
        >
          {hasChildren ? (
            <FolderOpen size={13} className="text-warning-500 shrink-0" fill="currentColor" />
          ) : (
            <Folder size={13} className="text-warning-500 shrink-0" fill="currentColor" />
          )}
          <span
            className="text-xs font-semibold text-default-600 uppercase tracking-wide"
            style={{ fontSize: depth === 0 ? '0.7rem' : '0.65rem' }}
          >
            {node.name}
          </span>
        </div>

        {/* Cases directly in this folder */}
        {folderCases.map((c) => {
          const globalIdx = orderedCases.indexOf(c);
          const status = c.RunCases?.[0]?.status ?? 0;
          const isFocused = globalIdx === focusedIndex;
          const statusColor = testRunCaseStatus[status].chartColor;

          // passed/failed get stronger tint; others stay subtle
          const isProminent = status === 1 || status === 2;
          const normalOpacity = isProminent ? '30' : '14';
          const focusedOpacity = isProminent ? '50' : '2e';
          const rowBg = status === 0
            ? isFocused ? 'rgba(0,0,0,0.04)' : undefined
            : isFocused ? `${statusColor}${focusedOpacity}` : `${statusColor}${normalOpacity}`;

          return (
            <div
              key={c.id}
              className="flex items-center gap-3 py-2.5 border-b border-divider cursor-pointer select-none transition-colors"
              style={{
                paddingLeft: `${indent + 28}px`,
                paddingRight: '12px',
                backgroundColor: rowBg,
                borderLeft: `3px solid ${statusColor}`,
              }}
              onClick={() => setFocusedIndex(globalIdx)}
            >
              {/* Row number */}
              <span className="text-xs text-default-400 w-7 shrink-0 text-right tabular-nums">
                {globalIdx + 1}
              </span>

              {/* Case ID + title */}
              <span className="flex-1 text-sm truncate min-w-0">
                <span className="text-default-400 text-xs me-1.5">#{c.id}</span>
                {c.title}
              </span>

              {/* Inline status buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {testRunCaseStatus.map((s, si) => {
                  const isActive = status === si;
                  return (
                    <button
                      key={s.uid}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(globalIdx, si);
                      }}
                      className={`text-xs px-2 py-0.5 rounded font-medium transition-all border ${
                        isActive
                          ? 'text-white border-transparent'
                          : 'border-default-200 dark:border-neutral-600 text-default-500 hover:border-default-400'
                      }`}
                      style={isActive ? { backgroundColor: s.chartColor, borderColor: s.chartColor } : {}}
                      title={testRunCaseStatusMessages[s.uid as TestRunCaseStatusUidType]}
                    >
                      {testRunCaseStatusMessages[s.uid as TestRunCaseStatusUidType][0].toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Recurse into child folders */}
        {(node.children ?? []).map((child) => renderFolderNode(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ── Top bar ── */}
      <div className="shrink-0 border-b border-divider px-4 py-2 flex items-center gap-3">
        <Tooltip content={messages.backToRuns}>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="rounded-full"
            onPress={() => router.push(`/projects/${projectId}/runs`, { locale })}
          >
            <ArrowLeft size={16} />
          </Button>
        </Tooltip>

        <span className="font-bold text-sm truncate flex-1">{run?.name ?? ''}</span>

        {/* Status count pills */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {testRunCaseStatus.map((s, si) => {
            const count = statusCountMap.get(si) ?? 0;
            return (
              <span
                key={s.uid}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${s.chartColor}22`, color: s.chartColor }}
              >
                {testRunCaseStatusMessages[s.uid as TestRunCaseStatusUidType]}: {count}
              </span>
            );
          })}
        </div>

        <Badge isInvisible={!isDirty} color="danger" size="sm" content="" shape="circle">
          <Button
            size="sm"
            color="primary"
            startContent={<Save size={14} />}
            isLoading={isSaving}
            isDisabled={!isDirty || !tokenContext.isProjectReporter(Number(projectId))}
            onPress={onSave}
          >
            {isSaving ? messages.saving : messages.save}
          </Button>
        </Badge>
      </div>

      {/* ── Progress bar ── */}
      {total > 0 && (
        <div className="shrink-0 h-1.5 flex w-full">
          {testRunCaseStatus.map((s, si) => {
            const count = statusCountMap.get(si) ?? 0;
            const pct = (count / total) * 100;
            return pct > 0 ? (
              <div key={s.uid} style={{ width: `${pct}%`, backgroundColor: s.chartColor }} />
            ) : null;
          })}
        </div>
      )}

      {/* ── Case list ── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-default-400 text-sm">Loading...</div>
        ) : orderedCases.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-default-400 text-sm text-center px-6">
            {messages.noCases}
          </div>
        ) : (
          treeData.map((node) => renderFolderNode(node, 0))
        )}
      </div>

      {/* ── Keyboard hint bar ── */}
      <div className="shrink-0 border-t border-divider px-4 py-1.5 text-xs text-default-400 text-center">
        {messages.keyboardHint}
      </div>
    </div>
  );
}
