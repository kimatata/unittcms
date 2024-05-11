import { Code, Card, CardBody } from "@nextui-org/react";
import { useTranslations } from "next-intl";

export default function SelfHostProcedure() {
  const t = useTranslations("Index");
  const manualProcedures = [
    {
      uid: "clone",
      detail: "",
      code: "git clone git@github.com:kimatata/TestCaseManager.git",
    },
    { uid: "go-to-backend", detail: "", code: "cd backend" },
    { uid: "backend-install", detail: "", code: "npm install" },
    { uid: "backend-start", detail: "", code: "node index" },
    { uid: "go-to-frontend", detail: "", code: "cd frontend" },
    { uid: "front-install", detail: "", code: "npm install" },
    { uid: "front-start", detail: "", code: "npm run start" },
  ];

  return (
    <>
      <div>
        <h3 className="text-2xl font-bold">{t("run_as_docker")}</h3>
        <Card fullWidth={true} className="bg-red-400">
          <CardBody>To be implemented</CardBody>
        </Card>
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-bold">{t("run_by_manually")}</h3>
        <div className="mt-3">
          {manualProcedures.map((procedure, index) => (
            <div key={procedure.uid} className={`${index !== 0 ? "mt-3" : ""}`}>
              <p>{procedure.detail}</p>
              <Code radius="sm" className="min-w-96">
                {procedure.code}
              </Code>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
