'use client';
import { useEffect, useState, useContext } from 'react';
import { Button } from '@heroui/react';
import { Plus } from 'lucide-react';
import RunsTable from './RunsTable';
import RunDialog from './RunDialog';
import { fetchRuns, createRun, updateRun, deleteRun } from './runsControl';
import { RunType, RunsMessages } from '@/types/run';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { TokenContext } from '@/utils/TokenProvider';
import { LocaleCodeType } from '@/types/locale';
import { logError } from '@/utils/errorHandler';

type Props = {
  projectId: string;
  locale: LocaleCodeType;
  messages: RunsMessages;
};

const defaultRun = {
  id: 0,
  name: 'Untitled Run',
  configurations: 0,
  description: '',
  state: 0,
  projectId: 0,
  createdAt: '',
  updatedAt: '',
};

export default function RunsPage({ projectId, locale, messages }: Props) {
  const context = useContext(TokenContext);
  const [runs, setRuns] = useState<RunType[]>([]);

  // run dialog
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);
  const [editingRun, setEditingRun] = useState<RunType | null>(null);
  const openDialogForCreate = () => {
    setIsRunDialogOpen(true);
    setEditingRun(defaultRun);
  };

  const closeDialog = () => {
    setIsRunDialogOpen(false);
    setEditingRun(null);
  };

  // delete confirm dialog
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  const [deleteRunId, setDeleteRunId] = useState<number | null>(null);
  const closeDeleteConfirmDialog = () => {
    setIsDeleteConfirmDialogOpen(false);
    setDeleteRunId(null);
  };

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }

      try {
        const data = await fetchRuns(context.token.access_token, Number(projectId));
        setRuns(data);
      } catch (error: unknown) {
        logError('Error fetching runs', error);
      }
    }

    fetchDataEffect();
  }, [context, projectId]);

  const onSubmit = async (name: string, description: string) => {
    if (editingRun && editingRun.createdAt) {
      const updatedRun: RunType = await updateRun(context.token.access_token, editingRun);
      const updatedRuns = runs.map((run) => (run.id === updatedRun.id ? updatedRun : run));
      setRuns(updatedRuns);
    } else {
      const newRun = await createRun(context.token.access_token, Number(projectId), name, description);
      setRuns([...runs, newRun]);
    }
    closeDialog();
  };

  const onDeleteClick = (runId: number) => {
    setDeleteRunId(runId);
    setIsDeleteConfirmDialogOpen(true);
  };

  const onConfirm = async () => {
    if (deleteRunId) {
      await deleteRun(context.token.access_token, deleteRunId);
      setRuns(runs.filter((run) => run.id !== deleteRunId));
      closeDeleteConfirmDialog();
    }
  };

  return (
    <div className="mx-auto max-w-5xl pt-10 px-8 flex-grow">
      <div className="w-full pb-6 flex items-center justify-between">
        <h1 className="text-4xl font-extrabold text-[#2b2f37] tracking-tight">{messages.runList}</h1>
        <div>
          <Button
            startContent={<Plus size={16} />}
            size="sm"
            isDisabled={!context.isProjectReporter(Number(projectId))}
            className="bg-gradient-to-r from-[#4953ac] to-[#652fe7] text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 px-5"
            onPress={openDialogForCreate}
          >
            {messages.newRun}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <RunsTable
          projectId={projectId}
          isDisabled={!context.isProjectReporter(Number(projectId))}
          runs={runs}
          onDeleteRun={onDeleteClick}
          messages={messages}
          locale={locale}
        />
      </div>

      <RunDialog
        isOpen={isRunDialogOpen}
        editingRun={editingRun}
        onCancel={closeDialog}
        onSubmit={onSubmit}
        messages={messages}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteConfirmDialogOpen}
        onCancel={closeDeleteConfirmDialog}
        onConfirm={onConfirm}
        closeText={messages.close}
        confirmText={messages.areYouSure}
        deleteText={messages.delete}
      />
    </div>
  );
}
