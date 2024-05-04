import RunEditor from "./RunEditor";

export default function Page({
  params,
}: {
  params: { projectId: string; runId: string; locale: string };
}) {
  return (
    <RunEditor
      projectId={params.projectId}
      runId={params.runId}
      locale={params.locale}
    />
  );
}
