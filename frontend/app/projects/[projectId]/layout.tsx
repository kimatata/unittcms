import Sidebar from "./sidebar";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex border-t-1 dark:border-neutral-700 min-h-screen">
        <Sidebar />
        <div className="flex w-full">
          <div className="flex-grow">{children}</div>
        </div>
      </div>
    </>
  );
}
