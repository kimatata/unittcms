import RunsPage from "./RunsPage";

export default function Page({ params }: { params: { projectId: string } }) {
  return (
    <>
      <RunsPage projectId={params.projectId} />
    </>
  );
}
