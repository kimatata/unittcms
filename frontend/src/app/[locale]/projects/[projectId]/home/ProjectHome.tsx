'use client';
import { useState, useEffect, useContext } from 'react';
import { Folder, Clipboard, FlaskConical } from 'lucide-react';
import { useTheme } from 'next-themes';
import { aggregateBasicInfo, aggregateTestPriority, aggregateTestType, aggregateProgress } from './aggregate';
import { HomeMessages } from './page';
import TestTypesChart from './TestTypesDonutChart';
import TestPriorityChart from './TestPriorityDonutChart';
import TestProgressBarChart from './TestProgressColumnChart';
import Config from '@/config/config';
import { TokenContext } from '@/utils/TokenProvider';
import { ProgressSeriesType } from '@/types/run';
import { TestRunCaseStatusMessages } from '@/types/status';
import { TestTypeMessages } from '@/types/testType';
import { PriorityMessages } from '@/types/priority';
import { ProjectType } from '@/types/project';
import { CasePriorityCountType, CaseTypeCountType } from '@/types/chart';
import { logError } from '@/utils/errorHandler';

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
  } catch (error: unknown) {
    logError('Error fetching data:', error);
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
  const { theme } = useTheme();
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
      } catch (error: unknown) {
        logError('Error in effect:', error);
      }
    }

    fetchDataEffect();
  }, [context, projectId]);

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
  }, [project, testRunCaseStatusMessages]);

  return (
    <div className="mx-auto max-w-5xl pt-8 px-8 pb-16 flex-grow">
      <h1 className="text-4xl font-extrabold text-[#2b2f37] tracking-tight mb-2">{project.name}</h1>

      {project.detail && (
        <p className="text-slate-500 text-sm mb-6">{project.detail}</p>
      )}

      <div className="grid grid-cols-3 gap-5 mt-6 mb-10">
        <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Folder size={22} className="text-[#4953ac]" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-[#2b2f37]">{folderNum}</p>
            <p className="text-sm text-slate-500 font-semibold">{messages.folders}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
            <Clipboard size={22} className="text-[#006859]" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-[#2b2f37]">{caseNum}</p>
            <p className="text-sm text-slate-500 font-semibold">{messages.testCases}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
            <FlaskConical size={22} className="text-[#652fe7]" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-[#2b2f37]">{runNum}</p>
            <p className="text-sm text-slate-500 font-semibold">{messages.testRuns}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
        <h2 className="text-xl font-bold text-[#2b2f37] tracking-tight mb-6">{messages.progress}</h2>
        <div style={{ height: '16rem' }}>
          <TestProgressBarChart progressSeries={progressSeries} progressCategories={progressCategories} theme={theme} />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-[#2b2f37] tracking-tight mb-6">{messages.testClassification}</h2>
        <div className="flex pb-4">
          <div style={{ width: '32rem', height: '18rem' }}>
            <h3 className="text-sm font-semibold text-slate-500 mb-3">{messages.byType}</h3>
            <TestTypesChart typesCounts={typesCounts} testTypeMessages={testTypeMessages} theme={theme} />
          </div>
          <div style={{ width: '30rem', height: '18rem' }}>
            <h3 className="text-sm font-semibold text-slate-500 mb-3">{messages.byPriority}</h3>
            <TestPriorityChart priorityCounts={priorityCounts} priorityMessages={priorityMessages} theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
}
