import { useTranslations } from "next-intl";
import { title } from "@/components/primitives";
import Image from "next/image";
import heroImage from "./hero.png";
import MainTitle from "./MainTitle";

export default function Home(params: { locale: string }) {
  const t = useTranslations("Index");

  return (
    <section className="mx-auto max-w-screen-lg my-12">
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
        className="flex flex-wrap"
        style={{
          marginTop: "10rem",
        }}
      >
        <h2 className={title()}>{t("features")}</h2>
      </div>

      <div
        className="flex flex-wrap"
        style={{
          marginTop: "10rem",
        }}
      >
        <h2 className={title()}>{t("demo_screen")}</h2>
        <div className="mt-12">
          <Image src={heroImage} alt="Hero" />
        </div>
      </div>
    </section>
  );
}
