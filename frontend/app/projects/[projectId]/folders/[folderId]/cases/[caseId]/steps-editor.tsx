import { Textarea, Button } from "@nextui-org/react";
import { StepType } from "./page";
import { Plus, Trash } from "lucide-react";

type Props = {
  steps: StepType[];
  onStepUpdate: (stepId: number, step: StepType) => void;
  onStepPlus: () => void;
  onStepDelete: (stepId: number) => void;
};

export default function StepsEditor({
  steps,
  onStepUpdate,
  onStepPlus,
  onStepDelete,
}: Props) {
  return (
    <>
      {steps.map((step, index) => (
        <div key={index} className="flex">
          <Textarea
            size="sm"
            variant="bordered"
            label="Details of the step"
            placeholder="Details of the step"
            value={step.step}
            onValueChange={(changeValue) => {
              onStepUpdate(step.id, { ...step, step: changeValue });
            }}
            className="mt-3 me-1"
          />

          <Textarea
            size="sm"
            variant="bordered"
            label="Expected Result"
            placeholder="Expected Result"
            value={step.result}
            onValueChange={(changeValue) => {
              onStepUpdate(step.id, { ...step, result: changeValue });
            }}
            className="mt-3 ms-1"
          />
          <div className="mt-3 ms-1">
            <Button
              isIconOnly
              size="sm"
              className="bg-transparent rounded-full"
              onPress={() => onStepDelete(step.id)}
            >
              <Trash size={16} />
            </Button>
            <Button
              isIconOnly
              size="sm"
              className="bg-transparent rounded-full"
              onPress={onStepPlus}
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>
      ))}
    </>
  );
}
