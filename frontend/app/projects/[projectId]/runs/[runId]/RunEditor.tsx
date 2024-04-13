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
  Listbox,
  ListboxItem,
  Divider,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Folder } from "lucide-react";
import { testRunStatus } from "@/config/selection";
import { RunType } from "@/types/run";
import { FolderType } from "@/types/folder";
import { fetchRun, updateRun } from "../runsControl";
import { fetchFolders } from "../../folders/foldersControl";
import { fetchCases } from "../../folders/[folderId]/cases/caseControl";

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
  const [folders, setFolders] = useState([]);
  const [testcases, setTestCases] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderType>({});
  const [isNameInvalid, setIsNameInvalid] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const caseData = await fetchRun(runId);
        setTestRun(caseData);
        const foldersData = await fetchFolders(projectId);
        setFolders(foldersData);
      } catch (error) {
        console.error("Error in effect:", error.message);
      }
    }

    fetchDataEffect();
  }, []);

  useEffect(() => {
    async function fetchCasesData() {
      if (selectedFolder && selectedFolder.id) {
        try {
          const testCasesData = await fetchCases(selectedFolder.id);
          setTestCases(testCasesData);
        } catch (error) {
          console.error("Error fetching cases data:", error.message);
        }
      }
    }

    fetchCasesData();
  }, [selectedFolder]);

  const baseClass = "";
  const selectedClass = `${baseClass} bg-neutral-200 dark:bg-neutral-700`;

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
        <h6>Basic</h6>
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
            label="status"
            className="mt-3 max-w-xs"
          >
            {testRunStatus.map((state, index) => (
              <SelectItem key={state.uid} value={index}>
                {state.name}
              </SelectItem>
            ))}
          </Select>
        </div>

        <Divider className="my-6" />
        <h6>Select test cases</h6>
        <div className="mt-3 flex rounded-small border-2 dark:border-neutral-700">
          <div className="w-3/12 border-r-1 dark:border-neutral-700">
            <Listbox aria-label="Listbox Variants" variant="light">
              {folders.map((folder, index) => (
                <ListboxItem
                  key={index}
                  onClick={() => setSelectedFolder(folder)}
                  startContent={
                    <Folder size={20} color="#F7C24E" fill="#F7C24E" />
                  }
                  className={
                    selectedFolder && folder.id === selectedFolder.id
                      ? selectedClass
                      : baseClass
                  }
                >
                  {folder.name}
                </ListboxItem>
              ))}
            </Listbox>
          </div>
          <div className="">
            {testcases.map((testcase, index) => (
              <div key={index}>{testcase.title}</div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
