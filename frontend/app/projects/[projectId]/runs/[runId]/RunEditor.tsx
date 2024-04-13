"use client";
import React from "react";
import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Tooltip,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Plus } from "lucide-react";
import { testRunStatus } from "@/config/selection";
import { RunType } from "@/types/run";
import { fetchRun, updateRun } from "../runsControl";

const defaultTestRun = {
  id: 0,
  name: "",
  configurations: 0,
  description: "",
  state: 0,
  projectId: 0,
};

type Props = {
  projectId: string;
  runId: string;
};

export default function RunEditor({ projectId, runId }: Props) {
  const [testRun, setTestRun] = useState<RunType>(defaultTestRun);
  const [isNameInvalid, setIsNameInvalid] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const data = await fetchRun(runId);
        setTestRun(data);
      } catch (error) {
        console.error("Error in effect:", error.message);
      }
    }

    fetchDataEffect();
  }, []);

  return (
    <>
      <div className="border-b-1 dark:border-neutral-700 w-full p-3 flex items-center justify-between">
        <div className="flex items-center">
          <Tooltip content="Back to runs" placement="left">
            <Button
              isIconOnly
              size="sm"
              className="rounded-full bg-neutral-50 dark:bg-neutral-600"
              onPress={() => router.push(`/projects/${projectId}/runs`)}
            >
              <ArrowLeft size={16} />
            </Button>
          </Tooltip>
          <h3 className="font-bold ms-2">{testRun.name}</h3>
        </div>
        <Button
          startContent={<Save size={16} />}
          size="sm"
          color="primary"
          isLoading={isUpdating}
          onPress={async () => {
            setIsUpdating(true);
            await updateRun(testRun);
            setIsUpdating(false);
          }}
        >
          {isUpdating ? "Updating..." : "Update"}
        </Button>
      </div>

      <div className="container mx-auto max-w-3xl pt-6 px-6 flex-grow">
        <Input
          size="sm"
          type="text"
          variant="bordered"
          label="Name"
          value={testRun.name}
          isInvalid={isNameInvalid}
          errorMessage={isNameInvalid ? "please enter name" : ""}
          onChange={(e) => {
            setTestRun({ ...testRun, name: e.target.value });
          }}
          className="mt-3"
        />

        <Button
          startContent={<Plus size={16} />}
          size="sm"
          color="primary"
          onPress={async () => {}}
          className="mt-3"
        >
          Select test case
        </Button>

        <Textarea
          size="sm"
          variant="bordered"
          label="Description"
          placeholder="Test run description"
          value={testRun.description}
          onValueChange={(changeValue) => {
            setTestRun({ ...testRun, description: changeValue });
          }}
          className="mt-3"
        />

        <div>
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[testRunStatus[testRun.state].uid]}
            onSelectionChange={(e) => {
              const selectedUid = e.anchorKey;
              const index = testRunStatus.findIndex(
                (template) => template.uid === selectedUid
              );
              setTestRun({ ...testRun, state: index });
            }}
            label="template"
            className="mt-3 max-w-xs"
          >
            {testRunStatus.map((state, index) => (
              <SelectItem key={state.uid} value={index}>
                {state.name}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </>
  );
}
