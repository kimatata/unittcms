import { useTranslations } from "next-intl";
import { title } from "@/components/primitives";
import { Snippet } from "@nextui-org/react";

export default function Page() {
  const t = useTranslations("Guide");
  const manualProcedures = [
    {
      uid: "clone",
      detail: "",
      code: "git clone git@github.com:kimatata/TestPlat.git",
    },
    {
      uid: "move-to-backend",
      detail: t("move_to_back"),
      code: "cd backend",
    },
    {
      uid: "backend-install",
      detail: t("backend_install"),
      code: "npm install",
    },
    { uid: "init-db", detail: t("init_db"), code: "npm run migrate" },
    { uid: "backend_start", detail: t("front_start"), code: "node index" },
    {
      uid: "move-to-frontend",
      detail: t("move_to_front"),
      code: "cd frontend",
    },
    {
      uid: "front-install",
      detail: t("frontend_install"),
      code: "npm install",
    },
    { uid: "front-start", detail: t("front_start"), code: "npm run start" },
  ];

  return (
    <section className="mx-auto max-w-screen-xl my-12">
      <h1 className={title({ size: "sm" })}>{t("run_by_manually")}</h1>
      <div className="mt-3">
        {manualProcedures.map((procedure, index) => (
          <div key={procedure.uid} className={`${index !== 0 ? "mt-3" : ""}`}>
            <p>{procedure.detail}</p>
            <Snippet variant="solid" color="primary" style={{ width: "32rem" }}>
              {procedure.code}
            </Snippet>
          </div>
        ))}
      </div>
    </section>
  );
}
