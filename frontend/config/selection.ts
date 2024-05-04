const priorities = [
  { uid: "critical", color: "#d00002" },
  { uid: "high", color: "#ee6b4e" },
  { uid: "medium", color: "#fccb69" },
  { uid: "low", color: "#0b62e8" },
];

const testTypes = [
  { name: "Other", uid: "other" },
  { name: "Security", uid: "security" },
  { name: "Performance", uid: "performance" },
  { name: "Accessibility", uid: "accessibility" },
  { name: "Functional", uid: "functional" },
  { name: "Acceptance", uid: "acceptance" },
  { name: "Usability", uid: "usability" },
  { name: "Smoke&Sanity", uid: "smoke-sanity" },
  { name: "Compatibility", uid: "compatibility" },
  { name: "Destructive", uid: "destructive" },
  { name: "Regression", uid: "regression" },
  { name: "Automated", uid: "automated" },
  { name: "Manual", uid: "manual" },
];

const automationStatus = [
  { name: "Automated", uid: "automated" },
  { name: "Automation Not Required", uid: "automation-not-required" },
  { name: "Cannot Be Automated", uid: "cannot-be-automated" },
  { name: "Obsolete", uid: "obsolete" },
];

const templates = [
  { name: "Text", uid: "text-template" },
  { name: "Step", uid: "step-template" },
];

const testRunStatus = [
  { name: "New", uid: "new" },
  { name: "In progress", uid: "in-progress" },
  { name: "Under review", uid: "under-review" },
  { name: "Rejected", uid: "rejected" },
  { name: "Done", uid: "done" },
  { name: "Closed", uid: "closed" },
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
