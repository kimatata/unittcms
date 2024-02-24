"use client";
import { Menu, MenuItem } from "@nextui-org/react";
import { LayoutDashboard, Files, FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import useGetCurrentIds from "@/utils/useGetCurrentIds";

export default function Sidebar() {
  const { projectId } = useGetCurrentIds();
  const router = useRouter();
  return (
    <div className="w-64 border-r-1 dark:border-neutral-700">
      <Menu aria-label="sidebar">
        <MenuItem
          startContent={<LayoutDashboard strokeWidth={1} size={28} />}
          className="p-3"
          onClick={() => router.push(`/projects/${projectId}/dashboard`)}
        >
          Dashboard
        </MenuItem>
        <MenuItem
          startContent={<Files strokeWidth={1} size={28} />}
          className="p-3"
          onClick={() => router.push(`/projects/${projectId}/folders`)}
        >
          Test Cases
        </MenuItem>
        <MenuItem
          startContent={<FlaskConical strokeWidth={1} size={28} />}
          className="p-3"
          onClick={() => router.push(`/projects/${projectId}/runs`)}
        >
          Test Runs
        </MenuItem>
      </Menu>
    </div>
  );
}
