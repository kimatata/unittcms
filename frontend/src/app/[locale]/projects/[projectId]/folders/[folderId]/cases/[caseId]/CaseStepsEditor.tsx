import { Textarea, Button, Tooltip, Avatar } from '@heroui/react';
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
        <div key={index} className="flex items-center my-1">
          <Avatar className="me-2" size="sm" name={step.caseSteps.stepNo.toString()} />
          <div key={step.id} className="grow flex gap-2">
            <div className="w-1/2">
              <Textarea
                size="sm"
                variant="bordered"
                label={messages.detailsOfTheStep}
                value={step.step}
                onValueChange={(changeValue) => {
                  onStepUpdate(step.id, { ...step, step: changeValue });
                }}
              />
            </div>
            <div className="w-1/2">
              <Textarea
                size="sm"
                variant="bordered"
                label={messages.expectedResult}
                value={step.result}
                onValueChange={(changeValue) => {
                  onStepUpdate(step.id, { ...step, result: changeValue });
                }}
              />
            </div>
          </div>
          <div className="flex flex-col">
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
