'use client';
import { useState, useEffect, useContext } from 'react';
import { Input, Textarea, Select, SelectItem, Button, Divider, Tooltip } from '@nextui-org/react';
import { useRouter } from '@/src/navigation';
import { Save, Plus, ArrowLeft, Circle } from 'lucide-react';
import { priorities, testTypes, templates } from '@/config/selection';
import CaseStepsEditor from './CaseStepsEditor';
import CaseAttachmentsEditor from './CaseAttachmentsEditor';
import { CaseType, AttachmentType, CaseMessages, StepType } from '@/types/case';
import { fetchCase, updateCase } from '@/utils/caseControl';
import { updateSteps } from './stepControl';
import { fetchCreateAttachments, fetchDownloadAttachment, fetchDeleteAttachment } from './attachmentControl';
import { TokenContext } from '@/utils/TokenProvider';

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
  Steps: [],
  Attachments: [],
  isIncluded: false,
  runStatus: 0,
};

type Props = {
  projectId: string;
  folderId: string;
  caseId: string;
  messages: CaseMessages;
  locale: string;
};

export default function CaseEditor({ projectId, folderId, caseId, messages, locale }: Props) {
  const context = useContext(TokenContext);
  const [testCase, setTestCase] = useState<CaseType>(defaultTestCase);
  const [isTitleInvalid, setIsTitleInvalid] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [plusCount, setPlusCount] = useState<number>(0);
  const router = useRouter();

  const onPlusClick = async (newStepNo: number) => {
    const newStep: StepType = {
      id: plusCount,
      step: '',
      result: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      caseSteps: {
        stepNo: newStepNo,
      },
      uid: `uid${plusCount}`,
      editState: 'new',
    };
    setPlusCount(plusCount + 1);

    if (testCase.Steps) {
      const updatedSteps = testCase.Steps.map((step) => {
        if (step.caseSteps.stepNo >= newStepNo) {
          return {
            ...step,
            editState: step.editState === 'notChanged' ? 'changed' : step.editState,
            caseSteps: {
              ...step.caseSteps,
              stepNo: step.caseSteps.stepNo + 1,
            },
          };
        }
        return step;
      });

      updatedSteps.push(newStep);

      setTestCase({
        ...testCase,
        Steps: updatedSteps,
      });
    }
  };

  const onDeleteClick = async (stepId: number) => {
    // find deletedStep's stepNo
    if (testCase.Steps) {
      const deletedStep = testCase.Steps.find((step) => step.id === stepId);
      if (!deletedStep) {
        return;
      }
      const deletedStepNo = deletedStep.caseSteps.stepNo;
      deletedStep.editState = 'deleted';

      const updatedSteps = testCase.Steps.map((step) => {
        if (step.caseSteps.stepNo > deletedStepNo) {
          return {
            ...step,
            editState: step.editState === 'notChanged' ? 'changed' : step.editState,
            caseSteps: {
              ...step.caseSteps,
              stepNo: step.caseSteps.stepNo - 1,
            },
          };
        }
        return step;
      });

      setTestCase({
        ...testCase,
        Steps: updatedSteps,
      });
    }
  };

  const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    handleFetchCreateAttachments(Number(caseId), event.dataTransfer.files);
  };

  const handleInput = (event: DragEvent) => {
    handleFetchCreateAttachments(Number(caseId), event.target.files);
  };

  const handleFetchCreateAttachments = async (caseId: number, files: File[]) => {
    const newAttachments = await fetchCreateAttachments(caseId, files);

    if (newAttachments) {
      const newAttachmentsWithJoinTable = [];
      newAttachments.forEach((attachment: AttachmentType) => {
        attachment.caseAttachments = { AttachmentId: attachment.id };
        newAttachmentsWithJoinTable.push(attachment);
      });
      const updatedAttachments = testCase.Attachments;
      updatedAttachments.push(...newAttachments);

      setTestCase({
        ...testCase,
        Attachments: updatedAttachments,
      });
    }
  };

  const onAttachmentDelete = async (attachmentId: number) => {
    await fetchDeleteAttachment(attachmentId);

    const filteredAttachments = testCase.Attachments.filter((attachment) => attachment.id !== attachmentId);

    setTestCase({
      ...testCase,
      Attachments: filteredAttachments,
    });
  };

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }
      try {
        const data = await fetchCase(context.token.access_token, Number(caseId));
        data.Steps.forEach((step: StepType) => {
          step.editState = 'notChanged';
        });
        setTestCase(data);
      } catch (error: any) {
        console.error('Error in effect:', error.message);
      }
    }

    fetchDataEffect();
  }, [context]);

  return (
    <>
      <div className="border-b-1 dark:border-neutral-700 w-full p-3 flex items-center justify-between">
        <div className="flex items-center">
          <Tooltip content={messages.backToCases} placement="left">
            <Button
              isIconOnly
              size="sm"
              className="rounded-full bg-neutral-50 dark:bg-neutral-600"
              onPress={() => router.push(`/projects/${projectId}/folders/${folderId}/cases`, { locale: locale })}
            >
              <ArrowLeft size={16} />
            </Button>
          </Tooltip>
          <h3 className="font-bold ms-2">{testCase.title}</h3>
        </div>
        <Button
          startContent={<Save size={16} />}
          size="sm"
          isDisabled={!context.isProjectDeveloper(Number(projectId))}
          color="primary"
          isLoading={isUpdating}
          onPress={async () => {
            setIsUpdating(true);
            await updateCase(context.token.access_token, testCase);
            if (testCase.Steps) {
              await updateSteps(context.token.access_token, Number(caseId), testCase.Steps);
            }
            setIsUpdating(false);
          }}
        >
          {isUpdating ? messages.updating : messages.update}
        </Button>
      </div>

      <div className="p-5">
        <h6 className="font-bold">{messages.basic}</h6>
        <Input
          size="sm"
          type="text"
          variant="bordered"
          label={messages.title}
          value={testCase.title}
          isInvalid={isTitleInvalid}
          errorMessage={isTitleInvalid ? messages.pleaseEnterTitle : ''}
          onChange={(e) => {
            setTestCase({ ...testCase, title: e.target.value });
          }}
          className="mt-3"
        />

        <Textarea
          size="sm"
          variant="bordered"
          label={messages.description}
          placeholder={messages.testCaseDescription}
          value={testCase.description}
          onValueChange={(changeValue) => {
            setTestCase({ ...testCase, description: changeValue });
          }}
          className="mt-3"
        />

        <div>
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[priorities[testCase.priority].uid]}
            onSelectionChange={(e) => {
              const selectedUid = e.anchorKey;
              const index = priorities.findIndex((priority) => priority.uid === selectedUid);
              setTestCase({ ...testCase, priority: index });
            }}
            startContent={
              <Circle size={8} color={priorities[testCase.priority].color} fill={priorities[testCase.priority].color} />
            }
            label={messages.priority}
            className="mt-3 max-w-xs"
          >
            {priorities.map((priority, index) => (
              <SelectItem key={priority.uid} value={index}>
                {messages[priority.uid]}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div>
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[testTypes[testCase.type].uid]}
            onSelectionChange={(e) => {
              const selectedUid = e.anchorKey;
              const index = testTypes.findIndex((type) => type.uid === selectedUid);
              setTestCase({ ...testCase, type: index });
            }}
            label={messages.type}
            className="mt-3 max-w-xs"
          >
            {testTypes.map((type, index) => (
              <SelectItem key={type.uid} value={index}>
                {messages[type.uid]}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div>
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[templates[testCase.template].uid]}
            onSelectionChange={(e) => {
              const selectedUid = e.anchorKey;
              const index = templates.findIndex((template) => template.uid === selectedUid);
              setTestCase({ ...testCase, template: index });
            }}
            label={messages.template}
            className="mt-3 max-w-xs"
          >
            {templates.map((template, index) => (
              <SelectItem key={template.uid} value={index}>
                {messages[template.uid]}
              </SelectItem>
            ))}
          </Select>
        </div>

        <Divider className="my-6" />
        {templates[testCase.template].uid === 'text' ? (
          <div>
            <h6 className="font-bold">{messages.testDetail}</h6>
            <div className="flex">
              <Textarea
                size="sm"
                variant="bordered"
                label={messages.preconditions}
                value={testCase.preConditions}
                onValueChange={(changeValue) => {
                  setTestCase({ ...testCase, preConditions: changeValue });
                }}
                className="mt-3 pe-1"
              />

              <Textarea
                size="sm"
                variant="bordered"
                label={messages.expectedResult}
                value={testCase.expectedResults}
                onValueChange={(changeValue) => {
                  setTestCase({ ...testCase, expectedResults: changeValue });
                }}
                className="mt-3 ps-1"
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center">
              <h6 className="font-bold">{messages.steps}</h6>
              <Button
                startContent={<Plus size={16} />}
                size="sm"
                isDisabled={!context.isProjectDeveloper(Number(projectId))}
                color="primary"
                className="ms-3"
                onPress={() => onPlusClick(1)}
              >
                {messages.newStep}
              </Button>
            </div>
            <CaseStepsEditor
              isDisabled={!context.isProjectDeveloper(Number(projectId))}
              steps={testCase.Steps}
              onStepUpdate={(stepId, changeStep) => {
                setTestCase({
                  ...testCase,
                  Steps: testCase.Steps.map((step) => {
                    if (step.id === stepId) {
                      return changeStep;
                    } else {
                      return step;
                    }
                  }),
                });
              }}
              onStepPlus={onPlusClick}
              onStepDelete={onDeleteClick}
              messages={messages}
            />
          </div>
        )}

        <Divider className="my-6" />
        <h6 className="font-bold">{messages.attachments}</h6>
        <CaseAttachmentsEditor
          isDisabled={!context.isProjectDeveloper(Number(projectId))}
          attachments={testCase.Attachments}
          onAttachmentDownload={(attachmentId: number, downloadFileName: string) =>
            fetchDownloadAttachment(attachmentId, downloadFileName)
          }
          onAttachmentDelete={onAttachmentDelete}
          onFilesDrop={handleDrop}
          onFilesInput={handleInput}
          messages={messages}
        />
      </div>
    </>
  );
}
