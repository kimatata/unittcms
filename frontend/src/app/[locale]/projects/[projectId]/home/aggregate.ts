import { ProjectType } from '@/types/project';
import { testTypes, priorities, testRunCaseStatus } from '@/config/selection';
import { TestRunCaseStatusMessages } from '@/types/status';
import { CasePriorityCountType, CaseTypeCountType } from '@/types/chart';

// aggregate folder, case, run mum
function aggregateBasicInfo(project: ProjectType) {
  const folderNum = project.Folders.length;
  const runNum = project.Runs.length;

  let caseNum = 0;
  project.Folders.forEach((folder) => {
    caseNum += folder.Cases.length;
  });

  return { folderNum, runNum, caseNum };
}

function aggregateTestType(project: ProjectType): CaseTypeCountType[] {
  // count how many test cases are for each type
  const typesCounts: number[] = testTypes.map((entry) => {
    return 0;
  });
  project.Folders.forEach((folder) => {
    folder.Cases.forEach((testcase) => {
      const type = testcase.type;
      typesCounts[type]++;
    });
  });

  const result: CaseTypeCountType[] = [];
  for (let type = 0; type <= testTypes.length; type++) {
    result.push({ type: type, count: typesCounts[type] });
  }

  return result;
}

function aggregateTestPriority(project: ProjectType) {
  // count how many test cases are for each priority
  const priorityCounts: number[] = priorities.map((entry) => {
    return 0;
  });
  project.Folders.forEach((folder) => {
    folder.Cases.forEach((testcase) => {
      const priority = testcase.priority;
      priorityCounts[priority]++;
    });
  });

  const result: CasePriorityCountType[] = [];
  for (let priority = 0; priority <= priorities.length; priority++) {
    result.push({ priority: priority, count: priorityCounts[priority] });
  }

  return result;
}

function aggregateProgress(project: ProjectType, testRunCaseStatusMessages: TestRunCaseStatusMessages) {
  type ChartSeries = { name: string; data: number[] };
  let series: ChartSeries[] = testRunCaseStatus.map((status) => {
    return { name: testRunCaseStatusMessages[status.uid], data: [] };
  });
  let categories: string[] = [];

  project.Runs.forEach((run) => {
    if (!run.RunCases) {
      return;
    }

    run.RunCases.forEach((runCase) => {
      const createdAtDate = new Date(runCase.createdAt);
      const dateString = createdAtDate.toISOString().slice(0, 10);

      const alreadyExists = categories.includes(dateString);
      if (!alreadyExists) {
        categories.push(dateString);
        series.forEach((itr) => {
          itr.data.push(0);
        });
      }
    });
  });

  project.Runs.forEach((run) => {
    if (!run.RunCases) {
      return;
    }

    run.RunCases.forEach((runCase) => {
      const createdAtDate = new Date(runCase.createdAt);
      const dateString = createdAtDate.toISOString().slice(0, 10);
      const index = categories.indexOf(dateString);

      const target = series[runCase.status];
      target.data[index]++;
    });
  });

  return { series, categories };
}

export { aggregateBasicInfo, aggregateTestType, aggregateTestPriority, aggregateProgress };
