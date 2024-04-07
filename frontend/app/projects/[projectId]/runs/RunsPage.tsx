"use client";
import { useEffect, useState } from "react";
import { Button } from "@nextui-org/react";
import { Plus } from "lucide-react";
import { RunType } from "@/types/run";
import RunsTable from "./RunsTable";
import RunDialog from "./RunDialog";
import {
  fetchRuns,
  createRun,
  updateRun,
  deleteRun,
} from "./runsControl";

type Props = {
  projectId: string;
};

export default function RunsPage({ projectId }: Props) {
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const data = await fetchRuns(projectId);
        setRuns(data);
      } catch (error) {
        console.error("Error in effect:", error.message);
      }
    }

    fetchDataEffect();
  }, []);

  // dialog
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);
  const [editingRun, setEditingRun] = useState<RunType | null>(
    null
  );
  const openDialogForCreate = () => {
    setIsRunDialogOpen(true);
    setEditingRun(null);
  };

  const closeDialog = () => {
    setIsRunDialogOpen(false);
    setEditingRun(null);
  };

  const onSubmit = async (name: string, detail: string) => {
    if (editingRun) {
      const updatedRun = await updateRun(
        editingRun.id,
        name,
        detail
      );
      const updatedRuns = runs.map((run) =>
        run.id === updatedRun.id ? updatedRun : run
      );
      setRuns(updatedRuns);
    } else {
      const newRun = await createRun(name, detail);
      setRuns([...runs, newRun]);
    }
    closeDialog();
  };

  const onEditClick = (run: RunType) => {
    setEditingRun(run);
    setIsRunDialogOpen(true);
  };

  const onDeleteClick = async (runId: number) => {
    try {
      await deleteRun(runId);
      setRuns(runs.filter((run) => run.id !== runId));
    } catch (error) {
      console.error("Error deleting run:", error);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl pt-16 px-6 flex-grow">
      <div className="w-full p-3 flex items-center justify-between">
        <h3 className="font-bold">Runs</h3>
        <div>
          <Button
            startContent={<Plus size={16} />}
            size="sm"
            color="primary"
            onClick={openDialogForCreate}
          >
            New Run
          </Button>
        </div>
      </div>

      <RunsTable
        runs={runs}
        onEditRun={onEditClick}
        onDeleteRun={onDeleteClick}
      />

      <RunDialog
        isOpen={isRunDialogOpen}
        editingRun={editingRun}
        onCancel={closeDialog}
        onSubmit={onSubmit}
      />
    </div>
  );
}
