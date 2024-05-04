import FoldersPane from "./FoldersPane";

export default function FoldersLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string; locale: string };
}) {
  return (
    <div className="flex w-full">
      <FoldersPane projectId={params.projectId} locale={params.locale} />
      <div className="flex-grow w-full">{children}</div>
    </div>
  );
}
