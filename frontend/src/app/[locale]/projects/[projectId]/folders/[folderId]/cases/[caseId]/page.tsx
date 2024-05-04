import CaseEditor from "./CaseEditor";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("Case");
  const messages = {
    critical: t("critical"),
    high: t("high"),
    medium: t("medium"),
    low: t("low"),
  };

  return (
    <CaseEditor
      params={{
        projectId: params.projectId,
        folderId: params.folderId,
        caseId: params.caseId,
        messages: messages,
        locale: params.locale,
      }}
    />
  );
}
