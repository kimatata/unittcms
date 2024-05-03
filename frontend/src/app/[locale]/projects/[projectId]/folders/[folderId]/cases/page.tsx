import CasesPane from "./CasesPane";

export default function Page({
  params,
}: {
  params: { projectId: string; folderId: string };
}) {
  return (
    <>
      <CasesPane projectId={params.projectId} folderId={params.folderId} />
    </>
  );
}
