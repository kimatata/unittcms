import RunsPage from "./RunsPage";
import { useTranslations } from "next-intl";

export default function Page({
  params,
}: {
  params: { projectId: string; locale: string };
}) {
  const t = useTranslations("Runs");
  const messages = {
    runs: t("runs"),
    id: t("id"),
    name: t("name"),
    description: t("description"),
    lastUpdate: t("last_update"),
    actions: t("actions"),
    newRun: t("new_run"),
    deleteRun: t("delete_run"),
    noRunsFound: t("no_runs_found"),
  };

  return (
    <>
      <RunsPage
        projectId={params.projectId}
        locale={params.locale}
        messages={messages}
      />
    </>
  );
}
