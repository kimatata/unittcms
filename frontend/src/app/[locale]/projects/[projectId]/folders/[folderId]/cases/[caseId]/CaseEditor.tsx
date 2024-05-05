"use client";
import { useEffect, useState } from "react";
import {
  Input,
  Textarea,
  Select,
  SelectItem,
  Button,
  Divider,
  Tooltip,
} from "@nextui-org/react";
import { useRouter } from "@/src/navigation";
import { Save, Plus, ArrowLeft, ArrowUpFromLine, Circle } from "lucide-react";
import { priorities, testTypes, templates } from "@/config/selection";
import CaseStepsEditor from "./CaseStepsEditor";
import CaseAttachmentsEditor from "./CaseAttachmentsEditor";
import { CaseType, AttachmentType, CaseMessages } from "@/types/case";
import { fetchCase, updateCase } from "../caseControl";
import { fetchCreateStep, fetchDeleteStep } from "./stepControl";
import {
  fetchCreateAttachments,
  fetchDownloadAttachment,
  fetchDeleteAttachment,
} from "./attachmentControl";

const defaultTestCase = {
  id: 0,
  title: "",
  state: 0,
  priority: 0,
  type: 0,
  automationStatus: 0,
  description: "",
  template: 0,
  preConditions: "",
  expectedResults: "",
  folderId: 0,
};

type Props = {
  projectId: string;
  folderId: string;
  caseId: string;
  messages: CaseMessages;
  locale: string;
};

export default function CaseEditor({
  projectId,
  folderId,
  caseId,
  messages,
  locale,
}: Props) {
  const [testCase, setTestCase] = useState<CaseType>(defaultTestCase);
  const [isTitleInvalid, setIsTitleInvalid] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const router = useRouter();

  const onPlusClick = async (newStepNo: number) => {
    const newStep = await fetchCreateStep(newStepNo, caseId);
    if (newStep) {
      newStep.caseSteps = { stepNo: newStepNo };
      const updatedSteps = testCase.Steps.map((step) => {
        if (step.caseSteps.stepNo >= newStepNo) {
          return {
            ...step,
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
    const deletedStep = testCase.Steps.find((step) => step.id === stepId);
    if (!deletedStep) {
      return;
    }
    const deletedStepNo = deletedStep.caseSteps.stepNo;

    // delete request
    await fetchDeleteStep(stepId, caseId);

    const updatedSteps = testCase.Steps.map((step) => {
      if (step.caseSteps.stepNo > deletedStepNo) {
        return {
          ...step,
          caseSteps: {
            ...step.caseSteps,
            stepNo: step.caseSteps.stepNo - 1,
          },
        };
      }
      return step;
    }).filter((step) => step.id !== stepId);

    setTestCase({
      ...testCase,
      Steps: updatedSteps,
    });
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    handleFetchCreateAttachments(caseId, event.dataTransfer.files);
  };

  const handleInput = (event) => {
    handleFetchCreateAttachments(caseId, event.target.files);
  };

  const handleFetchCreateAttachments = async (
    caseId: number,
    files: File[]
  ) => {
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

    const filteredAttachments = testCase.Attachments.filter(
      (attachment) => attachment.id !== attachmentId
    );

    setTestCase({
      ...testCase,
      Attachments: filteredAttachments,
    });
  };

  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const data = await fetchCase(caseId);
        setTestCase(data);
      } catch (error: any) {
        console.error("Error in effect:", error.message);
      }
    }

    fetchDataEffect();
  }, []);

  return (
    <>
      <div className="border-b-1 dark:border-neutral-700 w-full p-3 flex items-center justify-between">
        <div className="flex items-center">
          <Tooltip content={messages.backToCases} placement="left">
            <Button
              isIconOnly
              size="sm"
              className="rounded-full bg-neutral-50 dark:bg-neutral-600"
              onPress={() =>
                router.push(
                  `/projects/${projectId}/folders/${folderId}/cases`,
                  { locale: locale }
                )
              }
            >
              <ArrowLeft size={16} />
            </Button>
          </Tooltip>
          <h3 className="font-bold ms-2">{testCase.title}</h3>
        </div>
        <Button
          startContent={<Save size={16} />}
          size="sm"
          color="primary"
          isLoading={isUpdating}
          onPress={async () => {
            setIsUpdating(true);
            await updateCase(testCase);
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
          errorMessage={isTitleInvalid ? messages.pleaseEnterTitle : ""}
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
              const index = priorities.findIndex(
                (priority) => priority.uid === selectedUid
              );
              setTestCase({ ...testCase, priority: index });
            }}
            startContent={
              <Circle
                size={8}
                color={priorities[testCase.priority].color}
                fill={priorities[testCase.priority].color}
              />
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
              const index = testTypes.findIndex(
                (type) => type.uid === selectedUid
              );
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
              const index = templates.findIndex(
                (template) => template.uid === selectedUid
              );
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
        {templates[testCase.template].uid === "text" ? (
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
                color="primary"
                className="ms-3"
                onPress={() => onPlusClick(1)}
              >
                {messages.newStep}
              </Button>
            </div>
            <CaseStepsEditor
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
          attachments={testCase.Attachments}
          onAttachmentDownload={(
            attachmentId: number,
            downloadFileName: string
          ) => fetchDownloadAttachment(attachmentId, downloadFileName)}
          onAttachmentDelete={onAttachmentDelete}
          messages={messages}
        />
        <div
          className="flex items-center justify-center w-96 mt-3"
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
        >
          <label
            htmlFor="dropzone-file"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-neutral-200 border-dashed rounded-lg cursor-pointer bg-neutral-50 dark:hover:bg-bray-800 dark:bg-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:hover:border-neutral-500 dark:hover:bg-neutral-600"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <ArrowUpFromLine />
              <p className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
                <span className="font-semibold">{messages.clickToUpload}</span>
                <span>{messages.orDragAndDrop}</span>
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {messages.maxFileSize}: 50 MB
              </p>
            </div>
            <input
              id="dropzone-file"
              type="file"
              className="hidden"
              onChange={handleInput}
              multiple
            />
          </label>
        </div>
      </div>
    </>
  );
}
