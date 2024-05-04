import RunsPage from "./RunsPage";

export default function Page({
  params,
}: {
  params: { projectId: string; locale: string };
}) {
  return (
    <>
      <RunsPage projectId={params.projectId} locale={params.locale} />
    </>
  );
}
