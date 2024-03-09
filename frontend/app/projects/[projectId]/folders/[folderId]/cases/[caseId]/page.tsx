"use client";
import { useEffect, useState } from "react";
import {
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Button,
  Divider,
} from "@nextui-org/react";
import { Plus, ArrowUpFromLine } from "lucide-react";
import { priorities, testTypes, templates } from "@/config/selection";
import StepsEditor from "./steps-editor";
import Config from "@/config/config";
const apiServer = Config.apiServer;

type CaseType = {
  id: number;
  title: string;
  state: number;
  priority: number;
  type: number;
  automationStatus: number;
  description: string;
  template: number;
  preConditions: string;
  expectedResults: string;
  folderId: number;
  Steps: StepType[];
};

type CaseStepType = {
  createdAt: Date;
  updatedAt: Date;
  CaseId: number;
  StepId: number;
};

export type StepType = {
  id: number;
  step: string;
  result: string;
  createdAt: Date;
  updatedAt: Date;
  caseSteps: CaseStepType;
};

const defaultTestCase = {
  id: 0,
  title: "",
  state: 0,
  priority: 0,
  type: 0,
  automationStatus: 0,
  description: "",
  template: 0,
  preConditions: "",
  expectedResults: "",
  folderId: 0,
};

/**
 * fetch case
 */
async function fetchCase(url: string) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
}

/**
 * delete step
 */
async function fetchDeleteStep(stepId: number, parentCaseId: number) {
  const fetchOptions = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const url = `${apiServer}/steps/${stepId}?parentCaseId=${parentCaseId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
}

/**
 * Update folder
 */
async function updateCase(updateCaseData: CaseType) {
  const fetchOptions = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateCaseData),
  };

  const url = `${apiServer}/cases/${updateCaseData.id}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
}

export default function Page({
  params,
}: {
  params: { projectId: string; folderId: string; caseId: string };
}) {
  const [testCase, setTestCase] = useState<CaseType>(defaultTestCase);
  const [isTitleInvalid, setIsTitleInvalid] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const url = `${apiServer}/cases?caseId=${params.caseId}`;

  const onPlusClick = async (newStepNo: number) => {
    console.log(newStepNo);
  };

  const onDeleteClick = async (stepId: number) => {
    // find deletedStep's stepNo
    const deletedStep = testCase.Steps.find((step) => step.id === stepId);
    if (!deletedStep) {
      return;
    }
    const deletedStepNo = deletedStep.caseSteps.stepNo;
    console.log(deletedStepNo)

    // delete request
    await fetchDeleteStep(stepId, params.caseId);
    // const updatedSteps = testCase.Steps.filter((step) => step.id !== stepId);
    // setTestCase({
    //   ...testCase,
    //   Steps: updatedSteps,
    // });

    const updatedSteps = testCase.Steps.map(step => {
      if (step.caseSteps.stepNo > deletedStepNo) {
        console.log("bigger", step)
        return {
          ...step,
          caseSteps: {
            ...step.caseSteps,
            stepNo: step.caseSteps.stepNo - 1
          }
        };
      }
      return step;
    }).filter(step => step.id !== stepId);

    setTestCase({
      ...testCase,
      Steps: updatedSteps,
    });
  };

  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const data = await fetchCase(url);
        setTestCase(data);
      } catch (error) {
        console.error("Error in effect:", error.message);
      }
    }

    fetchDataEffect();
  }, []);

  return (
    <div className="p-5">
      <h6>Basic</h6>
      <Input
        size="sm"
        type="text"
        variant="bordered"
        label="Title"
        value={testCase.title}
        isInvalid={isTitleInvalid}
        errorMessage={isTitleInvalid ? "please enter title" : ""}
        onChange={(e) => {
          setTestCase({ ...testCase, title: e.target.value });
        }}
        className="mt-3"
      />

      <Textarea
        size="sm"
        variant="bordered"
        label="Description"
        placeholder="Test case description"
        value={testCase.description}
        onValueChange={(changeValue) => {
          setTestCase({ ...testCase, description: changeValue });
        }}
        className="mt-3"
      />

      <div>
        <Select
          size="sm"
          variant="bordered"
          selectedKeys={[priorities[testCase.priority].uid]}
          onSelectionChange={(e) => {
            const selectedUid = e.anchorKey;
            const index = priorities.findIndex(
              (priority) => priority.uid === selectedUid
            );
            setTestCase({ ...testCase, priority: index });
          }}
          startContent={
            <Chip
              className="border-none gap-1 text-default-600"
              color={priorities[testCase.priority].color}
              size="sm"
              variant="dot"
            ></Chip>
          }
          label="Priority"
          className="mt-3 max-w-xs"
        >
          {priorities.map((priority, index) => (
            <SelectItem key={priority.uid} value={index}>
              {priority.name}
            </SelectItem>
          ))}
        </Select>
      </div>

      <div>
        <Select
          size="sm"
          variant="bordered"
          selectedKeys={[testTypes[testCase.type].uid]}
          onSelectionChange={(e) => {
            const selectedUid = e.anchorKey;
            const index = testTypes.findIndex(
              (type) => type.uid === selectedUid
            );
            setTestCase({ ...testCase, type: index });
          }}
          label="type"
          className="mt-3 max-w-xs"
        >
          {testTypes.map((type, index) => (
            <SelectItem key={type.uid} value={index}>
              {type.name}
            </SelectItem>
          ))}
        </Select>
      </div>

      <div>
        <Select
          size="sm"
          variant="bordered"
          selectedKeys={[templates[testCase.template].uid]}
          onSelectionChange={(e) => {
            const selectedUid = e.anchorKey;
            const index = templates.findIndex(
              (template) => template.uid === selectedUid
            );
            setTestCase({ ...testCase, template: index });
          }}
          label="template"
          className="mt-3 max-w-xs"
        >
          {templates.map((template, index) => (
            <SelectItem key={template.uid} value={index}>
              {template.name}
            </SelectItem>
          ))}
        </Select>
      </div>

      <Divider className="my-6" />
      {templates[testCase.template].name === "Text" ? (
        <div>
          <h6>Test Detail</h6>
          <div className="flex">
            <Textarea
              size="sm"
              variant="bordered"
              label="PreConditions"
              placeholder="PreConditions"
              value={testCase.preConditions}
              onValueChange={(changeValue) => {
                setTestCase({ ...testCase, preConditions: changeValue });
              }}
              className="mt-3 pe-1"
            />

            <Textarea
              size="sm"
              variant="bordered"
              label="ExpectedResults"
              placeholder="ExpectedResults"
              value={testCase.expectedResults}
              onValueChange={(changeValue) => {
                setTestCase({ ...testCase, expectedResults: changeValue });
              }}
              className="mt-3 ps-1"
            />
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center">
            <h6>Steps</h6>
            <Button
              startContent={<Plus size={16} />}
              size="sm"
              color="primary"
              className="ms-3"
              onPress={() => onPlusClick(1)}
            >
              New Step
            </Button>
          </div>
          <StepsEditor
            steps={testCase.Steps}
            onStepUpdate={(stepId, changeStep) => {
              setTestCase({
                ...testCase,
                Steps: testCase.Steps.map((step) => {
                  if (step.id === stepId) {
                    return changeStep;
                  } else {
                    return step;
                  }
                }),
              });
            }}
            onStepPlus={onPlusClick}
            onStepDelete={onDeleteClick}
          />
        </div>
      )}

      <Divider className="my-6" />
      <h6>Attachments</h6>
      <div className="flex items-center justify-center w-96 mt-3">
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-200 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <ArrowUpFromLine />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Max. file size: 50 MB
            </p>
          </div>
          <input id="dropzone-file" type="file" className="hidden" />
        </label>
      </div>

      <div className="mt-6">
        <Button
          color="primary"
          isLoading={isUpdating}
          onPress={async () => {
            setIsUpdating(true);
            await updateCase(testCase);
            setTimeout(() => {
              setIsUpdating(false);
            }, 1000);
          }}
        >
          {isUpdating ? "Updating..." : "Update"}
        </Button>
      </div>
    </div>
  );
}
