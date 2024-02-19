"use client";
import { Menu, MenuItem } from "@nextui-org/react";
import { HomeIcon, PagesIcon, PlayIcon } from "@/components/icons";
import { useRouter } from "next/navigation";
import useGetCurrentIds from "@/utils/useGetCurrentIds";

export default function Sidebar() {
  const { projectId } = useGetCurrentIds();
  const router = useRouter();
  return (
    <div className="w-64 bg-white border-r-1">
      <Menu aria-label="sidebar">
        <MenuItem
          startContent={<HomeIcon size={28} />}
          className="p-3"
          onClick={() => router.push(`/projects/${projectId}/home`)}
        >
          Home
        </MenuItem>
        <MenuItem
          startContent={<PagesIcon size={28} />}
          className="p-3"
          onClick={() => router.push(`/projects/${projectId}/folders`)}
        >
          Test Cases
        </MenuItem>
        <MenuItem
          startContent={<PlayIcon size={28} />}
          className="p-3"
          onClick={() => router.push(`/projects/${projectId}/runs`)}
        >
          Test Runs
        </MenuItem>
      </Menu>
    </div>
  );
}
