import CasesPane from "./CasesPane";
import { useTranslations } from "next-intl";

export default function Page({
  params,
}: {
  params: { projectId: string; folderId: string; locale: string };
}) {
  const t = useTranslations("Cases");
  const messages = {
    testCases: t("test_cases"),
    // folder: t("folder"),
    // newFolder: t("new_folder"),
    
    // deleteFolder: t("delete_folder"),
    id: t("id"),
    title: t("title"),
    priority: t("priority"),
    actions: t("actions"),
    deleteCase: t("delete_case"),
    delete: t("delete"),
    newTestCase: t("new_test_case"),
    // projectName: t("folder_name"),
    // projectDetail: t("folder_detail"),
    // close: t("close"),
    // create: t("create"),
    // update: t("update"),
    // pleaseEnter: t("please_enter"),
  };

  return (
    <>
      <CasesPane
        projectId={params.projectId}
        folderId={params.folderId}
        locale={params.locale}
        messages={messages}
      />
    </>
  );
}
