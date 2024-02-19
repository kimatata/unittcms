"use client";
import { Button } from "@nextui-org/react";
import { useRouter } from "next/navigation";

export default function Page({ params }: { params: { projectId: string, folderId: string } }) {
  const router = useRouter();
  return (
    <>
      <Button
        className="ms-5 mt-3"
        onClick={() => router.push(`/projects/${params.projectId}/folders/${params.folderId}/cases/`)}
      >
        Back
      </Button>
      <div>This is each test case</div>
    </>
  );
}
