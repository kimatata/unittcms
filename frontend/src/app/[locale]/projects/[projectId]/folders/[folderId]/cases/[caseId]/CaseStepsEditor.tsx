import { Textarea, Button, Tooltip } from '@nextui-org/react';
import { CaseMessages, StepType } from '@/types/case';
import { Plus, Trash } from 'lucide-react';

type Props = {
  isDisabled: boolean;
  steps: StepType[];
  onStepUpdate: (stepId: number, step: StepType) => void;
  onStepPlus: (newStepNo: number) => void;
  onStepDelete: (stepId: number) => void;
  messages: CaseMessages;
};

export default function StepsEditor({ isDisabled, steps, onStepUpdate, onStepPlus, onStepDelete, messages }: Props) {
  // sort steps by junction table's column
  const sortedSteps = steps.slice().sort((a, b) => {
    const stepNoA = a.caseSteps.stepNo;
    const stepNoB = b.caseSteps.stepNo;
    return stepNoA - stepNoB;
  });

  // filter steps
  const filteredSteps = sortedSteps.filter((entry) => entry.editState !== 'deleted');

  return (
    <>
      {filteredSteps.map((step, index) => (
        <div key={index} className="flex">
          <div className="bg-neutral-50 dark:bg-neutral-600 rounded-full flex items-center justify-center min-w-unit-8 w-unit-8 h-unit-8 mt-3 me-2">
            <div>{step.caseSteps.stepNo}</div>
          </div>
          <Textarea
            size="sm"
            variant="bordered"
            label={messages.detailsOfTheStep}
            value={step.step}
            onValueChange={(changeValue) => {
              onStepUpdate(step.id, { ...step, step: changeValue });
            }}
            className="mt-3 me-1"
          />

          <Textarea
            size="sm"
            variant="bordered"
            label={messages.expectedResult}
            value={step.result}
            onValueChange={(changeValue) => {
              onStepUpdate(step.id, { ...step, result: changeValue });
            }}
            className="mt-3 ms-1"
          />
          <div className="mt-3 ms-1">
            <Tooltip content={messages.deleteThisStep} placement="left">
              <Button
                isIconOnly
                size="sm"
                isDisabled={isDisabled}
                className="bg-transparent rounded-full"
                onPress={() => onStepDelete(step.id)}
              >
                <Trash size={16} />
              </Button>
            </Tooltip>
            <Tooltip content={messages.insertStep} placement="left">
              <Button
                isIconOnly
                isDisabled={isDisabled}
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
