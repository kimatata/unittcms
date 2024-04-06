import FoldersPane from "./FoldersPane";

export default function FoldersLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  return (
    <div className="flex w-full">
      <FoldersPane projectId={params.projectId} />
      <div className="flex-grow w-full">{children}</div>
    </div>
  );
}
