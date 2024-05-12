import { title, subtitle } from "@/components/primitives";
import { Button, Link as NextUiLink } from "@nextui-org/react";
import { Link } from "@/src/navigation";
import { useTranslations } from "next-intl";

type Props = {
  locale: string;
};

export default function MainTitle({ locale }: Props) {
  const t = useTranslations("Index");

  return (
    <div className="md:text-left text-center">
      <h1
        className={title({
          color: "green",
          class: "lg:text-7xl md:text-7xl sm:text-7xl text-7xl",
        })}
      >
        TestPlat
      </h1>
      <br />
      <br />
      <h1
        className={title({
          class: "lg:text-5xl md:text-5xl sm:text-5xl text-5xl",
        })}
      >
        {t("oss_tcmt")}
        <br />
        {t("web_application")}
      </h1>
      <h4 className={subtitle({ class: "mt-4" })}>
        {t("integrate_and_manage")}
      </h4>

      <div className="mt-5">
        <Button color="primary" radius="full">
          <NextUiLink
            isExternal
            href="https://kimatata.github.io/TestPlat/docs/selfhost"
            aria-label="docs"
            className="text-white"
          >
            {t("get_started")}
          </NextUiLink>
        </Button>

        <Button color="primary" radius="full" className="ms-2">
          <Link href={`/projects/`} locale={locale}>
            {t("demo")}
          </Link>
        </Button>

        <Button color="primary" radius="full" className="ms-2">
          <NextUiLink
            size="sm"
            isExternal
            href="https://github.com/kimatata/TestPlat"
            aria-label="Github"
            className="text-white"
          >
            GitHub
          </NextUiLink>
        </Button>
      </div>
    </div>
  );
}
