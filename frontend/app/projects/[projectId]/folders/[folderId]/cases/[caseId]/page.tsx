"use client";
import { Button } from "@nextui-org/react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  return (
    <>
      <Button
        className="ms-5 mt-3"
        onClick={() => router.push(`/projects/1/folders/1/cases/`)}
      >
        Back
      </Button>
      <div>This is each test case</div>
    </>
  );
}
