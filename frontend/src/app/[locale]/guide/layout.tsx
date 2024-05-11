import Guidebar from "./GuideBar";

export default function GuideLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <div className="flex border-t-1 dark:border-neutral-700 min-h-[calc(100vh-64px)]">
      <Guidebar locale={locale} />
      <div className="flex w-full">
        <div className="flex-grow px-12">{children}</div>
      </div>
    </div>
  );
}
