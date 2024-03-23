import { Textarea, Button, Tooltip } from "@nextui-org/react";
import { StepType } from "./caseTypes";
import { Plus, Trash } from "lucide-react";

type Props = {
  steps: StepType[];
  onStepUpdate: (stepId: number, step: StepType) => void;
  onStepPlus: (newStepNo: number) => void;
  onStepDelete: (stepId: number) => void;
};

export default function StepsEditor({
  steps,
  onStepUpdate,
  onStepPlus,
  onStepDelete,
}: Props) {
  // sort steps by junction table's column
  const sortedSteps = steps.slice().sort((a, b) => {
    const stepNoA = a.caseSteps.stepNo;
    const stepNoB = b.caseSteps.stepNo;
    return stepNoA - stepNoB;
  });

  return (
    <>
      {sortedSteps.map((step, index) => (
        <div key={index} className="flex">
          <div className="bg-neutral-50 dark:bg-neutral-600 rounded-full flex items-center justify-center min-w-unit-8 w-unit-8 h-unit-8 mt-3 me-2">
            <div>{step.caseSteps.stepNo}</div>
          </div>
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
            <Tooltip content="Delete this step" placement="left">
              <Button
                isIconOnly
                size="sm"
                className="bg-transparent rounded-full"
                onPress={() => onStepDelete(step.id)}
              >
                <Trash size={16} />
              </Button>
            </Tooltip>
            <Tooltip content="Insert step" placement="left">
              <Button
                isIconOnly
                size="sm"
                className="bg-transparent rounded-full"
                onPress={() => onStepPlus(step.caseSteps.stepNo + 1)}
              >
                <Plus size={16} />
              </Button>
            </Tooltip>
          </div>
        </div>
      ))}
    </>
  );
}
