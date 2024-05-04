import CaseEditor from "./CaseEditor";

export default function Page({
  params,
}: {
  params: {
    projectId: string;
    folderId: string;
    caseId: string;
    locale: string;
  };
}) {
  return (
    <CaseEditor
      params={{
        projectId: params.projectId,
        folderId: params.folderId,
        caseId: params.caseId,
        locale: params.locale,
      }}
    />
  );
}
