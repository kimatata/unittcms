import { Home } from "./home";

export default function Page({ params }: { params: { projectId: string } }) {
  return (
    <>
      <Home projectId={params.projectId} />
    </>
  );
}
