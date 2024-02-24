"use client";
import { useEffect, useState } from "react";
import { Select, SelectItem } from "@nextui-org/react";
import priorities from "../priorities";
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

export default function Page({
  params,
}: {
  params: { projectId: string; folderId: string; caseId: string };
}) {
  const [testCase, setTestCase] = useState<CaseType>(defaultTestCase);

  const url = `${apiServer}/cases?caseId=${params.caseId}`;
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
      <h4 className="font-bold">{testCase.title}</h4>
      <Select
        selectedKeys={[priorities[testCase.priority].uid]}
        onSelectionChange={(e) => {
          const selectedUid = e.anchorKey;
          const index = priorities.findIndex(
            (priority) => priority.uid === selectedUid
          );
          setTestCase({ ...testCase, priority: index });
        }}
        label="Priority"
        className="mt-3 max-w-xs"
      >
        {priorities.map((priority, index) => (
          <SelectItem key={priority.uid} value={index}>
            {priority.name}
          </SelectItem>
        ))}
      </Select>

      <div>type: {testCase.type}</div>
      <div>automationStatus: {testCase.automationStatus}</div>
      <div>description: {testCase.description}</div>
      <div>template: {testCase.template}</div>
      <div>preConditions: {testCase.preConditions}</div>
      <div>expectedResults: {testCase.expectedResults}</div>
    </div>
  );
}
