export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="w-full flex items-center justify-center">{children}</div>
    </>
  );
}
