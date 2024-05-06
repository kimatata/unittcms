const priorities = [
  { uid: "critical", color: "#d00002" },
  { uid: "high", color: "#ee6b4e" },
  { uid: "medium", color: "#fccb69" },
  { uid: "low", color: "#0b62e8" },
];

const testTypes = [
  { uid: "other", chartColor: "#688ae8" },
  { uid: "security", chartColor: "#c33d69" },
  { uid: "performance", chartColor: "#2ea597" },
  { uid: "accessibility", chartColor: "#8456ce" },
  { uid: "functional", chartColor: "#e07941" },
  { uid: "acceptance", chartColor: "#3759ce" },
  { uid: "usability", chartColor: "#962249" },
  { uid: "smokeSanity", chartColor: "#096f64" },
  { uid: "compatibility", chartColor: "#6237a7" },
  { uid: "destructive", chartColor: "#a84401" },
  { uid: "regression", chartColor: "#273ea5" },
  { uid: "automated", chartColor: "#780d35" },
  { uid: "manual", chartColor: "#03524a" },
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
