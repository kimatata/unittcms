"use client";
import { title } from "@/components/primitives";
import { useState, useEffect } from "react";
import { Tabs, Tab, Image } from "@nextui-org/react";

type PaneDemoImagesMessages = {
  title: string;
  caseEdit: string;
  caseHome: string;
  caseRun: string;
};
type Props = {
  messages: PaneDemoImagesMessages;
};

export default function DemoImages({ messages }: Props) {
  const [currentTab, setcurrentTab] = useState("edit");
  const [currentImage, setcurrentImage] = useState({
    src: "/top/caseEdit.png",
    alt: messages.caseEdit,
  });
  const tabs = [
    {
      key: "edit",
      title: messages.caseEdit,
      src: "/top/caseEdit.png",
      alt: messages.caseEdit,
    },
    {
      key: "home",
      title: messages.caseHome,
      src: "/top/caseHome.png",
      alt: messages.caseHome,
    },
    {
      key: "run",
      title: messages.caseRun,
      src: "/top/caseRun.png",
      alt: messages.caseRun,
    },
  ];

  useEffect(() => {
    const found = tabs.find((tab) => tab.key === currentTab);
    const newImage = { src: found.src, alt: found.title };
    setcurrentImage(newImage);
  }, [currentTab]);

  return (
    <>
      <div className="flex flex-wrap lg:text-left text-center">
        <div className="w-full lg:w-5/12 p-4">
          <h2 className={title({ size: "sm" })}>{messages.title}</h2>
          <br />
          <Tabs
            aria-label="Options"
            color={"primary"}
            radius="full"
            size="md"
            className="mt-8"
            selectedKey={currentTab}
            onSelectionChange={setcurrentTab}
          >
            {tabs.map((tab) => (
              <Tab key={tab.key} title={tab.title} />
            ))}
          </Tabs>
        </div>

        <div
          className="flex justify-center w-full lg:w-7/12"
          style={{ height: "32rem" }}
        >
          <Image
            isBlurred
            src={currentImage.src}
            alt={currentImage.alt}
            shadow="md"
            className="max-w-full max-h-full"
          />
        </div>
      </div>
    </>
  );
}
