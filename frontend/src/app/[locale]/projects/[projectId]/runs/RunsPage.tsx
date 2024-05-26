'use client';
import { useEffect, useState } from 'react';
import { Button } from '@nextui-org/react';
import { Plus } from 'lucide-react';
import RunsTable from './RunsTable';
import { fetchRuns, createRun, updateRun, deleteRun } from './runsControl';
import { RunType, RunsMessages } from '@/types/run';
import RunDialog from './RunDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

type Props = {
  projectId: string;
  locale: string;
  messages: RunsMessages;
};

const defaultRun = {
  id: null,
  name: 'Untitled Run',
  configurations: null,
  description: null,
  state: null,
  projectId: null,
  createdAt: null,
  updatedAt: null,
};

export default function RunsPage({ projectId, locale, messages }: Props) {
  const [runs, setRuns] = useState([]);

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
      try {
        const data = await fetchRuns(projectId);
        setRuns(data);
      } catch (error: any) {
        console.error('Error in effect:', error.message);
      }
    }

    fetchDataEffect();
  }, []);

  const onSubmit = async (name: string, description: string) => {
    if (editingRun && editingRun.createdAt) {
      const updatedRun = await updateRun(editingRun);
      const updatedRuns = runs.map((run) => (run.id === updatedRun.id ? updatedRun : run));
      setRuns(updatedRuns);
    } else {
      const newRun = await createRun(projectId, name, description);
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
      await deleteRun(deleteRunId);
      setRuns(runs.filter((run) => run.id !== deleteRunId));
      closeDeleteConfirmDialog();
    }
  };

  return (
    <div className="container mx-auto max-w-3xl pt-6 px-6 flex-grow">
      <div className="w-full p-3 flex items-center justify-between">
        <h3 className="font-bold">{messages.runList}</h3>
        <div>
          <Button startContent={<Plus size={16} />} size="sm" color="primary" onClick={openDialogForCreate}>
            {messages.newRun}
          </Button>
        </div>
      </div>

      <RunsTable projectId={projectId} runs={runs} onDeleteRun={onDeleteClick} messages={messages} locale={locale} />

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
