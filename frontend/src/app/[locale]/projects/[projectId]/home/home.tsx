"use client";
import { useState, useEffect } from "react";
import { Divider } from "@nextui-org/react";
import { title } from "@/components/primitives";
import { Card, CardBody, Chip } from "@nextui-org/react";
import { Folder, Clipboard, FlaskConical } from "lucide-react";
import { CaseTypeCountType } from "@/types/case";
import { HomeMessages } from "./page";
import { testTypes } from "@/config/selection";
import TestTypesChart from "./TestTypesDonutChart";
import Config from "@/config/config";
const apiServer = Config.apiServer;

async function fetchProject(url) {
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
  } catch (error: any) {
    console.error("Error fetching data:", error.message);
  }
}

type Props = {
  projectId: string;
  messages: HomeMessages;
};

export function Home({ projectId, messages }: Props) {
  const [project, setProject] = useState({
    name: "",
    detail: "",
    Folders: [{ Cases: [] }],
    Runs: [{ RunCases: [] }],
  });
  const [folderNum, setFolderNum] = useState(0);
  const [caseNum, setCaseNum] = useState(0);
  const [runNum, setRunNum] = useState(0);
  const [typesCounts, setTypesCounts] = useState<CaseTypeCountType[]>();
  const url = `${apiServer}/home/${projectId}`;

  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const data = await fetchProject(url);
        setProject(data);
        console.log(data);
      } catch (error: any) {
        console.error("Error in effect:", error.message);
      }
    }

    fetchDataEffect();
  }, [url]);

  useEffect(() => {
    async function aggregate() {
      aggregateBasicInfo();
      aggregateTestType();
    }

    aggregate();
  }, [project]);

  // aggregate folder, case, run mum
  function aggregateBasicInfo() {
    let num = 0;
    setFolderNum(project.Folders.length);
    setRunNum(project.Runs.length);
    project.Folders.forEach((folder) => {
      num += folder.Cases.length;
    });
    setCaseNum(num);
  }

  // aggregate test types of each case
  function aggregateTestType() {
    const tempTypesCounts = {};
    project.Folders.forEach((folder) => {
      folder.Cases.forEach((testcase) => {
        const type = testcase.type;
        tempTypesCounts[type] = (tempTypesCounts[type] || 0) + 1;
      });
    });

    const result = [];
    for (let type = 0; type <= testTypes.length; type++) {
      result.push({ type: type, count: tempTypesCounts[type] || 0 });
    }

    setTypesCounts([...result]);
  }

  return (
    <div className="container mx-auto max-w-5xl pt-6 px-6 flex-grow">
      <h1 className={title({ size: "sm" })}>{project.name}</h1>
      <div className="mt-4">
        <Chip
          variant="flat"
          startContent={<Folder size={16} />}
          className="px-3"
        >
          {folderNum} {messages.folders}
        </Chip>
        <Chip
          variant="flat"
          startContent={<Clipboard size={16} />}
          className="px-3 ms-2"
        >
          {caseNum} {messages.testCases}
        </Chip>
        <Chip
          variant="flat"
          startContent={<FlaskConical size={16} />}
          className="px-3 ms-2"
        >
          {runNum} {messages.testRuns}
        </Chip>
      </div>

      <Card className="mt-3 bg-neutral-100" shadow="none">
        <CardBody>{project.detail}</CardBody>
      </Card>

      <Divider className="my-6" />

      <div className="flex">
        <div style={{ width: "32rem", height: "32rem" }}>
          <h3>{messages.testTypes}</h3>
          <TestTypesChart typesCounts={typesCounts} messages={messages} />
        </div>
        <div style={{ width: "32rem", height: "32rem" }}>
          <h3>{messages.testTypes}</h3>
          <TestTypesChart typesCounts={typesCounts} messages={messages} />
        </div>
      </div>
    </div>
  );
}
