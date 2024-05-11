import { useTranslations } from "next-intl";
import { Link, NextUiLinkClasses } from "@/src/navigation";

export type Props = {
  locale: string;
};

export default function Guidebar({ locale }: Props) {
  const t = useTranslations("Guide");
  const links = [
    {
      name: t("self_host"),
      href: "/guide/selfhost",
      indent: false,
    },
    {
      name: t("docker"),
      href: "/guide/selfhost/docker",
      indent: true,
    },
    {
      name: t("manual"),
      href: "/guide/selfhost/manual",
      indent: true,
    },
  ];

  return (
    <div className="w-64 border-r-1 ps-6 pt-6 dark:border-neutral-700">
      {links.map((link) => (
        <div key={link.name} className={`py-1 ${link.indent ? "ps-4" : ""}`}>
          <Link href={link.href} locale={locale} className={NextUiLinkClasses}>
            {link.name}
          </Link>
        </div>
      ))}
    </div>
  );
}
