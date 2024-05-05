const priorities = [
  { uid: "critical", color: "#d00002" },
  { uid: "high", color: "#ee6b4e" },
  { uid: "medium", color: "#fccb69" },
  { uid: "low", color: "#0b62e8" },
];

const testTypes = [
  { uid: "other" },
  { uid: "security" },
  { uid: "performance" },
  { uid: "accessibility" },
  { uid: "functional" },
  { uid: "acceptance" },
  { uid: "usability" },
  { uid: "smokeSanity" },
  { uid: "compatibility" },
  { uid: "destructive" },
  { uid: "regression" },
  { uid: "automated" },
  { uid: "manual" },
];

const automationStatus = [
  { name: "Automated", uid: "automated" },
  { name: "Automation Not Required", uid: "automation-not-required" },
  { name: "Cannot Be Automated", uid: "cannot-be-automated" },
  { name: "Obsolete", uid: "obsolete" },
];

const templates = [{ uid: "text" }, { uid: "step" }];

const testRunStatus = [
  { uid: "new" },
  { uid: "inProgress" },
  { uid: "underReview" },
  { uid: "rejected" },
  { uid: "done" },
  { uid: "closed" },
];

const testRunCaseStatus = [
  {
    uid: "untested",
    color: "primary",
    chartColor: "#e5e7eb",
  },
  { uid: "passed", color: "success", chartColor: "#059669" },
  { uid: "failed", color: "danger", chartColor: "#f87171" },
  { uid: "retest", color: "warning", chartColor: "#fbbf24" },
  { uid: "skipped", color: "primary", chartColor: "#4b5563" },
];

export {
  priorities,
  testTypes,
  automationStatus,
  templates,
  testRunStatus,
  testRunCaseStatus,
};
