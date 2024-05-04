import RunEditor from "./RunEditor";
import { useTranslations } from "next-intl";

export default function Page({
  params,
}: {
  params: { projectId: string; runId: string; locale: string };
}) {
  const t = useTranslations("Runs");
  const messages = {
    id: t("id"),
    title: t("title"),
    priority: t("priority"),
    actions: t("actions"),
    status: t("status"),
    critical: t("critical"),
    high: t("high"),
    medium: t("medium"),
    low: t("low"),
    untested: t("untested"),
    passed: t("passed"),
    failed: t("failed"),
    retest: t("retest"),
    skipped: t("skipped"),
    includeInRun: t("include_in_run"),
    excludeFromRun: t("exclude_from_run"),
    noCasesFound: t("no_cases_found"),
  };

  return (
    <RunEditor
      projectId={params.projectId}
      runId={params.runId}
      messages={messages}
      locale={params.locale}
    />
  );
}
