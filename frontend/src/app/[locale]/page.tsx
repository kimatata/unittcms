import { useTranslations } from "next-intl";
import { title, subtitle } from "@/components/primitives";
import { Divider } from "@nextui-org/react";
import Image from "next/image";
import heroImage from "./hero.png";
import MainTitle from "./MainTitle";
import MainFeatures from "./MainFeatures";
import SelfHostProcedure from "./SelfHostProcedure";

export default function Home(params: { locale: string }) {
  const t = useTranslations("Index");

  return (
    <section className="mx-auto max-w-screen-xl my-12">
      <div className="flex flex-wrap">
        <div className="w-full md:w-7/12 order-last md:order-first p-4">
          <MainTitle locale={params.locale} />
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
        className="flex flex-wrap flex-col items-center sm:flex-row sm:items-start"
        style={{
          marginTop: "6rem",
        }}
      >
        <MainFeatures />
      </div>

      <Divider className="my-12" />

      <div className="flex flex-wrap mt-12">
        <div className="w-full md:w-4/12 order-last md:order-first p-4">
          <h2 className={title({ size: "sm" })}>{t("organize_test_cases")}</h2>
        </div>
        <div className="w-full md:w-8/12 p-4">
          <Image src={heroImage} alt="Hero" className="max-w-2xl" />
        </div>
      </div>

      <Divider className="my-12" />

      <div className="flex flex-wrap mt-12">
        <div className="w-full md:w-4/12 order-last md:order-first p-4">
          <h2 className={title({ size: "sm" })}>{t("self_host")}</h2>
        </div>

        <div className="w-full md:w-8/12 p-4">
          <SelfHostProcedure />
        </div>
      </div>
    </section>
  );
}
