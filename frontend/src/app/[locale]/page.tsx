import { button as buttonStyles } from "@nextui-org/react";
import { title, subtitle } from "@/components/primitives";
import { useTranslations } from "next-intl";
import { Link } from "@/src/navigation";

export default function Home() {
  const t = useTranslations("Index");

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title({ color: "pink" })}>Open Source&nbsp;</h1>
        <h1 className={title()}>Test Case Management Tool&nbsp;</h1>
        <br />
        <h2 className={subtitle({ class: "text-inherit mt-4" })}>
          Integrate and manage all your software testing.
        </h2>
      </div>

      <h1>{t("title")}</h1>

      <div className="flex gap-3">
        <Link
          href="/projects"
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
        >
          Create first test project
        </Link>
      </div>
    </section>
  );
}
