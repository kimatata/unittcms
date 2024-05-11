import { useTranslations } from "next-intl";
import { title } from "@/components/primitives";
import { Snippet, Card, CardBody } from "@nextui-org/react";

export default function Page() {
  const t = useTranslations("Guide");

  return (
    <section className="mx-auto max-w-screen-xl my-12">
      <h1 className={title({ size: "sm" })}>{t("run_as_docker")}</h1>
    </section>
  );
}
