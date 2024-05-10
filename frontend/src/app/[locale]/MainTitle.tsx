import { title, subtitle } from "@/components/primitives";
import { Link } from "@/src/navigation";
import { button as buttonStyles } from "@nextui-org/react";
import { useTranslations } from "next-intl";

export default function MainTitle() {
  const t = useTranslations("Index");

  return (
    <div className="md:text-left text-center">
      <h1 className={title({ color: "green", class: "lg:text-7xl md:text-7xl sm:text-7xl text-7xl" })}>TestPlat</h1>
      <br />
      <br />
      <h1 className={title({ class: "lg:text-5xl md:text-5xl sm:text-5xl text-5xl" })}>{t("oss_tcmt")} </h1>
      <h4 className={subtitle({ class: "mt-4" })}>
        {t("integrate_and_manage")}
      </h4>

      <div className="mt-5">
        <Link
          href="/projects"
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
        >
          {t("get_started")}
        </Link>

        <Link
          href="/projects"
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
        >
          Features
        </Link>

        <Link
          href="/projects"
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
        >
          View on GitHub
        </Link>
      </div>
    </div>
  );
}
