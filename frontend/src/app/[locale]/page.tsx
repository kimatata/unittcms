import { useTranslations } from "next-intl";
import { title, subtitle } from "@/components/primitives";
import { Divider } from "@nextui-org/react";
import PaneMainTitle from "./PaneMainTitle";
import PaneMainFeatures from "./PaneMainFeatures";
import PaneDemoImages from "./PaneDemoImages";

export default function Home(params: { locale: string }) {
  const t = useTranslations("Index");

  const messages = {
    title: t("organize_test_cases"),
    caseEdit: t("case_edit"),
    caseHome: t("case_home"),
    caseRun: t("case_run"),
  };

  return (
    <section className="mx-auto max-w-screen-xl my-12">
      <div className="flex flex-wrap">
        <div className="w-full md:w-7/12 order-last md:order-first p-4">
          <PaneMainTitle locale={params.locale} />
        </div>

        <div className="w-full md:w-5/12 p-4">
          <div
            style={{
              position: "relative",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: "10rem",
                position: "relative",
                zIndex: 1,
                marginLeft: "2.5rem",
              }}
            >
              ⚗️
            </span>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                filter: "blur(48px)",
                zIndex: 0,
                background: "linear-gradient(to bottom, #ffecd2, #fcb69f)",
              }}
            ></div>
          </div>
        </div>
      </div>

      <div
        className="flex flex-wrap flex-col items-center"
        style={{
          marginTop: "6rem",
        }}
      >
        <PaneMainFeatures />
      </div>

      <Divider className="my-12" />
      <PaneDemoImages messages={messages} />

      <Divider className="my-12" />
      <div className="flex flex-wrap mt-12">
        <div className="w-full md:w-4/12 order-last md:order-first p-4">
          <h2 className={title({ size: "sm" })}>{t("roadmap")}</h2>
        </div>
        <div className="w-full md:w-8/12 p-4"></div>
      </div>
    </section>
  );
}
