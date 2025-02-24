'use client';
import { useEffect, useState, useContext } from 'react';
import { Button } from '@heroui/react';
import { Plus } from 'lucide-react';
import RunsTable from './RunsTable';
import { fetchRuns, createRun, updateRun, deleteRun } from './runsControl';
import { RunType, RunsMessages } from '@/types/run';
import RunDialog from './RunDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { TokenContext } from '@/utils/TokenProvider';
import { LocaleCodeType } from '@/types/locale';

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
      } catch (error: any) {
        console.error('Error in effect:', error.message);
      }
    }

    fetchDataEffect();
  }, [context]);

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
    <div className="container mx-auto max-w-3xl pt-6 px-6 flex-grow">
      <div className="w-full p-3 flex items-center justify-between">
        <h3 className="font-bold">{messages.runList}</h3>
        <div>
          <Button
            startContent={<Plus size={16} />}
            size="sm"
            isDisabled={!context.isProjectReporter(Number(projectId))}
            color="primary"
            onPress={openDialogForCreate}
          >
            {messages.newRun}
          </Button>
        </div>
      </div>

      <RunsTable
        projectId={projectId}
        isDisabled={!context.isProjectReporter(Number(projectId))}
        runs={runs}
        onDeleteRun={onDeleteClick}
        messages={messages}
        locale={locale}
      />

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
