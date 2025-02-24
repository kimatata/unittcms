'use client';
import { useState, useEffect, useContext } from 'react';
import { title, subtitle } from '@/components/primitives';
import { Card, CardBody, Chip, Divider } from '@heroui/react';
import { Folder, Clipboard, FlaskConical } from 'lucide-react';
import { ProgressSeriesType } from '@/types/run';
import { HomeMessages } from './page';
import { TokenContext } from '@/utils/TokenProvider';
import { aggregateBasicInfo, aggregateTestPriority, aggregateTestType, aggregateProgress } from './aggregate';
import Config from '@/config/config';
import { useTheme } from 'next-themes';
import TestTypesChart from './TestTypesDonutChart';
import TestPriorityChart from './TestPriorityDonutChart';
import TestProgressBarChart from './TestProgressColumnChart';
import { TestRunCaseStatusMessages } from '@/types/status';
import { TestTypeMessages } from '@/types/testType';
import { PriorityMessages } from '@/types/priority';
import { ProjectType } from '@/types/project';
import { CasePriorityCountType, CaseTypeCountType } from '@/types/chart';

const apiServer = Config.apiServer;

async function fetchProject(jwt: string, projectId: number) {
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/home/${projectId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching data:', error.message);
  }
}

type Props = {
  projectId: string;
  messages: HomeMessages;
  testRunCaseStatusMessages: TestRunCaseStatusMessages;
  testTypeMessages: TestTypeMessages;
  priorityMessages: PriorityMessages;
};

export function ProjectHome({
  projectId,
  messages,
  testRunCaseStatusMessages,
  testTypeMessages,
  priorityMessages,
}: Props) {
  const context = useContext(TokenContext);
  const { theme, setTheme } = useTheme();
  const [project, setProject] = useState<ProjectType>({
    id: 0,
    name: '',
    detail: '',
    isPublic: false,
    userId: 0,
    createdAt: '',
    updatedAt: '',
    Folders: [],
    Runs: [],
  });
  const [folderNum, setFolderNum] = useState(0);
  const [caseNum, setCaseNum] = useState(0);
  const [runNum, setRunNum] = useState(0);
  const [typesCounts, setTypesCounts] = useState<CaseTypeCountType[]>([]);
  const [priorityCounts, setPriorityCounts] = useState<CasePriorityCountType[]>([]);
  const [progressCategories, setProgressCategories] = useState<string[]>([]);
  const [progressSeries, setProgressSeries] = useState<ProgressSeriesType[]>([]);

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }

      try {
        const data = await fetchProject(context.token.access_token, Number(projectId));
        setProject(data);
      } catch (error: any) {
        console.error('Error in effect:', error.message);
      }
    }

    fetchDataEffect();
  }, [context]);

  useEffect(() => {
    async function aggregate() {
      if (!project) {
        return;
      }
      const { folderNum, runNum, caseNum } = aggregateBasicInfo(project);
      setFolderNum(folderNum);
      setRunNum(runNum);
      setCaseNum(caseNum);

      const typeRet = aggregateTestType(project);
      setTypesCounts([...typeRet]);

      const priorityRet = aggregateTestPriority(project);
      setPriorityCounts([...priorityRet]);

      const { series, categories } = aggregateProgress(project, testRunCaseStatusMessages);
      setProgressSeries([...series]);
      setProgressCategories([...categories]);
    }

    aggregate();
  }, [project]);

  return (
    <div className="container mx-auto max-w-5xl pt-6 px-6 flex-grow">
      <h1 className={title({ size: 'sm' })}>{project.name}</h1>
      <div className="mt-4">
        <Chip variant="flat" startContent={<Folder size={16} />} className="px-3">
          {folderNum} {messages.folders}
        </Chip>
        <Chip variant="flat" startContent={<Clipboard size={16} />} className="px-3 ms-2">
          {caseNum} {messages.testCases}
        </Chip>
        <Chip variant="flat" startContent={<FlaskConical size={16} />} className="px-3 ms-2">
          {runNum} {messages.testRuns}
        </Chip>
      </div>

      {project.detail && (
        <Card className="mt-3 bg-neutral-100 dark:bg-neutral-700 dark:text-white" shadow="none">
          <CardBody>{project.detail}</CardBody>
        </Card>
      )}

      <Divider className="my-8" />
      <h2 className={subtitle()}>{messages.progress}</h2>
      <div style={{ height: '18rem' }}>
        <TestProgressBarChart progressSeries={progressSeries} progressCategories={progressCategories} theme={theme} />
      </div>

      <Divider className="my-12" />
      <h2 className={subtitle()}>{messages.testClassification}</h2>
      <div className="flex pb-20">
        <div style={{ width: '32rem', height: '18rem' }}>
          <h3>{messages.byType}</h3>
          <TestTypesChart typesCounts={typesCounts} testTypeMessages={testTypeMessages} theme={theme} />
        </div>
        <div style={{ width: '30rem', height: '18rem' }}>
          <h3>{messages.byPriority}</h3>
          <TestPriorityChart priorityCounts={priorityCounts} priorityMessages={priorityMessages} theme={theme} />
        </div>
      </div>
    </div>
  );
}
