import RunEditor from "./RunEditor";

export default function Page({
  params,
}: {
  params: { projectId: string; runId: string };
}) {
  return <RunEditor projectId={params.projectId} runId={params.runId} />;
}
