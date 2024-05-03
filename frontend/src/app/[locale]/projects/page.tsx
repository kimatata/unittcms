import ProjectsPage from "./ProjectsPage";
import { useTranslations } from "next-intl";

export default function Page() {
  const t = useTranslations("Projects");
  const messages = {
    projects: t("projects"),
    project: t("project"),
    newProject: t("new_project"),
    editProject: t("edit_project"),
    deleteProject: t("delete_project"),
    id: t("id"),
    name: t("name"),
    detail: t("detail"),
    lastUpdate: t("last_update"),
    actions: t("actions"),
    projectName: t("project_name"),
    projectDetail: t("project_detail"),
    close: t("close"),
    create: t("create"),
    update: t("update"),
    pleaseEnter: t("please_enter"),
  };
  return (
    <>
      <ProjectsPage messages={messages} />
    </>
  );
}
