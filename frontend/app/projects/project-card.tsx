import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Divider,
  Image,
} from "@nextui-org/react";

export function ProjectCard({ projectName, projectDetail }) {
  return (
    <Card className="w-[250px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="https://avatars.githubusercontent.com/u/86160567?s=200&v=4"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">{ projectName }</p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody>
        <p>{projectDetail}</p>
      </CardBody>
    </Card>
  );
}
