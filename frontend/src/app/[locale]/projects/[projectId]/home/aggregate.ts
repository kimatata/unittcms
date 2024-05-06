import { ProjectType } from "@/types/project";
import { testTypes, priorities } from "@/config/selection";

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

// aggregate test types of each case
function aggregateTestType(project: ProjectType) {
  const typesCounts = {};
  project.Folders.forEach((folder) => {
    folder.Cases.forEach((testcase) => {
      const type = testcase.type;
      typesCounts[type] = (typesCounts[type] || 0) + 1;
    });
  });

  const result = [];
  for (let type = 0; type <= testTypes.length; type++) {
    result.push({ type: type, count: typesCounts[type] || 0 });
  }

  return result;
}

function aggregateTestPriority(project: ProjectType) {
  const priorityCounts = {};
  project.Folders.forEach((folder) => {
    folder.Cases.forEach((testcase) => {
      const priority = testcase.priority;
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    });
  });

  const result = [];
  for (let priority = 0; priority <= priorities.length; priority++) {
    result.push({ priority: priority, count: priorityCounts[priority] || 0 });
  }

  return result;
}

export { aggregateBasicInfo, aggregateTestType, aggregateTestPriority };
