import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/react';
import { testTypes, templates } from '@/config/selection';
import TestCasePriority from '@/components/TestCasePriority';
import { RunMessages } from '@/types/run';
import { CaseType } from '@/types/case';
import { PriorityMessages } from '@/types/priority';

type Props = {
  isOpen: boolean;
  testCase: CaseType;
  onCancel: () => void;
  onChangeStatus: (changeCaseId: number, status: number) => {};
  messages: RunMessages;
  priorityMessages: PriorityMessages;
};

export default function showTestCaseDetailDialog({
  isOpen,
  testCase,
  onCancel,
  onChangeStatus,
  messages,
  priorityMessages,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      size="3xl"
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
              <div>{messages[testTypes[testCase.type].uid]}</div>
            </div>
          </div>
        </ModalBody>
        <ModalBody>
          {templates[testCase.template].uid === 'text' ? (
            <div className="flex my-2">
              <div className="w-1/2">
                <p className={'font-bold'}>{messages.preconditions}</p>
                <div>{testCase.preConditions}</div>
              </div>

              <div className="w-1/2">
                <p className={'font-bold'}>{messages.expectedResult}</p>
                <div>{testCase.expectedResults}</div>
              </div>
            </div>
          ) : (
            <div className="flex my-2">
              {testCase.Steps &&
                testCase.Steps.map((step, index) => (
                  <>
                    <div className="w-1/2">
                      <p className={'font-bold'}>{messages.preconditions}</p>
                      <div>{step.step}</div>
                    </div>

                    <div className="w-1/2">
                      <p className={'font-bold'}>{messages.expectedResult}</p>
                      <div>{step.result}</div>
                    </div>
                  </>
                ))}
            </div>
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
