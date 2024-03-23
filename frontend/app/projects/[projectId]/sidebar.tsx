"use client";
import { useState } from "react";
import { Listbox, ListboxItem } from "@nextui-org/react";
import { Home, Files, FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import useGetCurrentIds from "@/utils/useGetCurrentIds";

export default function Sidebar() {
  const { projectId } = useGetCurrentIds();
  const router = useRouter();

  const [currentKey, setCurrentTab] = useState("home");
  const baseClass = "p-3 rounded-none";
  const selectedClass = `${baseClass} bg-neutral-200 dark:bg-neutral-700`;

  const handleTabClick = (key: string) => {
    setCurrentTab(key);
    if (key === "home") {
      router.push(`/projects/${projectId}/home`);
    } else if (key === "cases") {
      router.push(`/projects/${projectId}/folders`);
    } else if (key === "runs") {
      router.push(`/projects/${projectId}/runs`);
    }
  };

  const tabItems = [
    {
      key: "home",
      text: "Home",
      startContent: <Home strokeWidth={1} size={28} />,
    },
    {
      key: "cases",
      text: "Test Cases",
      startContent: <Files strokeWidth={1} size={28} />,
    },
    {
      key: "runs",
      text: "Test Runs",
      startContent: <FlaskConical strokeWidth={1} size={28} />,
    },
  ];

  return (
    <div className="w-64 border-r-1 dark:border-neutral-700">
      <Listbox
        aria-label="Listbox Variants"
        variant="light"
        className="p-0"
        onClick={() => router.push(`/projects/${projectId}/home`)}
      >
        {tabItems.map((itr, index) => (
          <ListboxItem
            key={itr.key}
            startContent={itr.startContent}
            onClick={() => handleTabClick(itr.key)}
            className={currentKey === itr.key ? selectedClass : baseClass}
          >
            {itr.text}
          </ListboxItem>
        ))}
      </Listbox>
    </div>
  );
}
