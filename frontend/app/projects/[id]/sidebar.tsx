import { Menu, MenuItem } from "@nextui-org/react";

export default function Sidebar({ children }) {
  return (
    <div className="flex">
      <div className="w-64 bg-white rounded-lg m-2">
        <Menu openMode="multiple" aria-label="Main Menu">
          <MenuItem>Menu Item 1</MenuItem>
          <MenuItem>Menu Item 2</MenuItem>
          <MenuItem>Menu Item 3</MenuItem>
        </Menu>
      </div>
      <div className="flex-grow bg-white rounded-lg m-2">{children}</div>
    </div>
  );
}
