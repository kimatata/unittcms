import { useTranslations } from "next-intl";
import { title } from "@/components/primitives";

export default function Page() {
  const t = useTranslations("Guide");

  return (
    <section className="mx-auto max-w-screen-xl my-12">
      <h1 className={title({ size: "sm" })}>{t("self_host")}</h1>
    </section>
  );
}
