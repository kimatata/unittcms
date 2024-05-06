import CasesPane from "./CasesPane";
import { useTranslations } from "next-intl";

export default function Page({
  params,
}: {
  params: { projectId: string; folderId: string; locale: string };
}) {
  const t = useTranslations("Cases");
  const messages = {
    testCaseList: t("test_case_list"),
    id: t("id"),
    title: t("title"),
    priority: t("priority"),
    actions: t("actions"),
    deleteCase: t("delete_case"),
    delete: t("delete"),
    newTestCase: t("new_test_case"),
    status: t("status"),
    critical: t("critical"),
    high: t("high"),
    medium: t("medium"),
    low: t("low"),
    noCasesFound: t("no_cases_found"),
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
