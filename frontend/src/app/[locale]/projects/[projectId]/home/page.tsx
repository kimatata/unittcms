import { Home } from "./home";
import { useTranslations } from "next-intl";

export type HomeMessages = {
  folders: string;
  testCases: string;
  testRuns: string;
  testTypes: string;
  other: string;
  security: string;
  performance: string;
  accessibility: string;
  functional: string;
  acceptance: string;
  usability: string;
  smokeSanity: string;
  compatibility: string;
  destructive: string;
  regression: string;
  automated: string;
  manual: string;
};

export default function Page({ params }: { params: { projectId: string } }) {
  const t = useTranslations("Home");
  const messages = {
    folders: t("Folders"),
    testCases: t("test_cases"),
    testRuns: t("test_runs"),
    testTypes: t("test_types"),
    other: t("other"),
    security: t("security"),
    performance: t("performance"),
    accessibility: t("accessibility"),
    functional: t("functional"),
    acceptance: t("acceptance"),
    usability: t("usability"),
    smokeSanity: t("smoke_sanity"),
    compatibility: t("compatibility"),
    destructive: t("destructive"),
    regression: t("regression"),
    automated: t("automated"),
    manual: t("manual"),
  };
  return (
    <>
      <Home projectId={params.projectId} messages={messages} />
    </>
  );
}
