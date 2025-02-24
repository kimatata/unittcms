import { useState, useEffect, useContext } from 'react';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Avatar, Textarea } from '@heroui/react';
import { testTypes, templates } from '@/config/selection';
import { RunMessages } from '@/types/run';
import { CaseType, StepType } from '@/types/case';
import { PriorityMessages } from '@/types/priority';
import TestCasePriority from '@/components/TestCasePriority';
import { TokenContext } from '@/utils/TokenProvider';
import { fetchCase } from '@/utils/caseControl';
import { TestTypeMessages } from '@/types/testType';

type Props = {
  isOpen: boolean;
  caseId: number;
  onCancel: () => void;
  onChangeStatus: (changeCaseId: number, status: number) => {};
  messages: RunMessages;
  testTypeMessages: TestTypeMessages;
  priorityMessages: PriorityMessages;
};

const defaultTestCase = {
  id: 0,
  title: '',
  state: 0,
  priority: 0,
  type: 0,
  automationStatus: 0,
  description: '',
  template: 0,
  preConditions: '',
  expectedResults: '',
  folderId: 0,
};

export default function TestCaseDetailDialog({
  isOpen,
  caseId,
  onCancel,
  onChangeStatus,
  messages,
  testTypeMessages,
  priorityMessages,
}: Props) {
  const context = useContext(TokenContext);
  const [testCase, setTestCase] = useState<CaseType>(defaultTestCase);

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }

      if (!caseId || caseId <= 0) {
        return;
      }

      try {
        const data = await fetchCase(context.token.access_token, Number(caseId));
        if (data.Steps && data.Steps.length > 0) {
          data.Steps.sort((a: StepType, b: StepType) => {
            const stepNoA = a.caseSteps.stepNo;
            const stepNoB = b.caseSteps.stepNo;
            return stepNoA - stepNoB;
          });
        }

        setTestCase(data);
      } catch (error: any) {
        console.error('Error in effect:', error.message);
      }
    }

    fetchDataEffect();
  }, [context, caseId]);

  return (
    <Modal
      isOpen={isOpen}
      size="5xl"
      scrollBehavior="outside"
      onOpenChange={() => {
        onCancel();
      }}
      classNames={{
        header: 'border-b-[1px] border-[#e5e5e5]',
        body: 'border-b-[1px] border-[#e5e5e5]',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{testCase.title}</ModalHeader>
        <ModalBody>
          <p className={'font-bold mt-2'}>{messages.description}</p>
          <div>{testCase.description}</div>

          <div className="flex my-2">
            <div className="w-1/2">
              <p className={'font-bold'}>{messages.priority}</p>
              <TestCasePriority priorityValue={testCase.priority} priorityMessages={priorityMessages} />
            </div>

            <div className="w-1/2">
              <p className={'font-bold'}>{messages.type}</p>
              <div>{testTypeMessages[testTypes[testCase.type].uid]}</div>
            </div>
          </div>
        </ModalBody>
        <ModalBody>
          {templates[testCase.template].uid === 'text' ? (
            <>
              <p className={'font-bold mt-2'}>{messages.testDetail}</p>
              <div className="flex gap-2 my-2">
                <div className="w-1/2">
                  <Textarea
                    isReadOnly
                    size="sm"
                    variant="flat"
                    label={messages.preconditions}
                    value={testCase.preConditions}
                  />
                </div>
                <div className="w-1/2">
                  <Textarea
                    isReadOnly
                    size="sm"
                    variant="flat"
                    label={messages.expectedResult}
                    value={testCase.expectedResults}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <p className={'font-bold mt-2'}>{messages.steps}</p>
              {testCase.Steps &&
                testCase.Steps.map((step) => (
                  <div key={step.id} className="flex items-center my-1">
                    <Avatar className="me-2" size="sm" name={step.caseSteps.stepNo.toString()} />
                    <div key={step.id} className="grow flex gap-2">
                      <div className="w-1/2">
                        <Textarea
                          isReadOnly
                          size="sm"
                          variant="flat"
                          label={messages.detailsOfTheStep}
                          value={step.step}
                        />
                      </div>
                      <div className="w-1/2">
                        <Textarea
                          isReadOnly
                          size="sm"
                          variant="flat"
                          label={messages.expectedResult}
                          value={step.result}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onCancel}>
            {messages.close}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
