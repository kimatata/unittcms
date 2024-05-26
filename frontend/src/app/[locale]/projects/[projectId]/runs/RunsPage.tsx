'use client';
import { useEffect, useState } from 'react';
import { Button } from '@nextui-org/react';
import { Plus } from 'lucide-react';
import RunsTable from './RunsTable';
import { fetchRuns, createRun, deleteRun } from './runsControl';
import { RunsMessages } from '@/types/run';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

type Props = {
  projectId: string;
  locale: string;
  messages: RunsMessages;
};

export default function RunsPage({ projectId, locale, messages }: Props) {
  const [runs, setRuns] = useState([]);

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

  const onCreateClick = async () => {
    try {
      const newRun = await createRun(projectId);
      const updateRuns = [...runs];
      updateRuns.push(newRun);
      setRuns(updateRuns);
    } catch (error: any) {
      console.error('Error deleting run:', error);
    }
  };

  // const onDeleteClick = async (runId: number) => {
  //   try {
  //     await deleteRun(runId);
  //     const data = await fetchRuns(projectId);
  //     setRuns(data);
  //   } catch (error: any) {
  //     console.error('Error deleting run:', error);
  //   }
  // };

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
          <Button startContent={<Plus size={16} />} size="sm" color="primary" onClick={onCreateClick}>
            {messages.newRun}
          </Button>
        </div>
      </div>

      <RunsTable projectId={projectId} runs={runs} onDeleteRun={onDeleteClick} messages={messages} locale={locale} />

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
