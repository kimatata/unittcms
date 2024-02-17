import { Menu, MenuItem } from "@nextui-org/react";
import { HomeIcon, PagesIcon, PlayIcon } from "@/components/icons";

export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r-1">
      <Menu aria-label="sidebar">
        <MenuItem startContent={<HomeIcon size={28} />} className="p-3">
          Home
        </MenuItem>
        <MenuItem startContent={<PagesIcon size={28} />} className="p-3">
          Test Cases
        </MenuItem>
        <MenuItem startContent={<PlayIcon size={28} />} className="p-3">
          Test Runs
        </MenuItem>
      </Menu>
    </div>
  );
}
