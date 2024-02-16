import React from "react";
import Sidebar from "./sidebar";

export default function Main() {
  return (
    <Sidebar>
      {/* ここにページの内容を配置 */}
      <div className="p-4">
        <h1 className="text-2xl font-bold">Main Content</h1>
        <p>This is the main content of the page.</p>
      </div>
    </Sidebar>
  );
}
