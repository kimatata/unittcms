"use client";
import { useEffect, useState } from "react";
import {
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Button,
} from "@nextui-org/react";
import { priorities, testTypes } from "@/config/selection";
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
 * Update folder
 */
async function updateCase(updateCaseData) {
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

  const url = `${apiServer}/cases?caseId=${params.caseId}`;
  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const data = await fetchCase(url);
        console.log(data)
        setTestCase(data);
      } catch (error) {
        console.error("Error in effect:", error.message);
      }
    }

    fetchDataEffect();
  }, []);

  return (
    <div className="p-5">
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

      <Textarea
        size="sm"
        variant="bordered"
        label="PreConditions"
        placeholder="PreConditions"
        value={testCase.preConditions}
        onValueChange={(changeValue) => {
          setTestCase({ ...testCase, preConditions: changeValue });
        }}
        className="mt-3"
      />

      <Textarea
        variant="bordered"
        label="ExpectedResults"
        placeholder="ExpectedResults"
        value={testCase.expectedResults}
        onValueChange={(changeValue) => {
          setTestCase({ ...testCase, expectedResults: changeValue });
        }}
        className="mt-3"
      />

      <div className="mt-3">
        <Button color="primary" onPress={() => updateCase(testCase)}>
          Update
        </Button>
      </div>
    </div>
  );
}
