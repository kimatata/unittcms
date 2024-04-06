"use client";
import { useEffect, useState } from "react";
import {
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Button,
  Divider,
  Tooltip,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { Save, Plus, ArrowLeft, ArrowUpFromLine } from "lucide-react";
import { priorities, testTypes, templates } from "@/config/selection";
import CaseStepsEditor from "./CaseStepsEditor";
import CaseAttachmentsEditor from "./CaseAttachmentsEditor";
import { CaseType, AttachmentType } from "@/types/case";
import {
  fetchCase,
  fetchCreateStep,
  fetchDeleteStep,
  updateCase,
  fetchCreateAttachments,
  fetchDownloadAttachment,
  fetchDeleteAttachment,
} from "./caseControl";

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

export default function CaseEditor({
  params,
}: {
  params: { projectId: string; folderId: string; caseId: string };
}) {
  const [testCase, setTestCase] = useState<CaseType>(defaultTestCase);
  const [isTitleInvalid, setIsTitleInvalid] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const router = useRouter();

  const onPlusClick = async (newStepNo: number) => {
    const newStep = await fetchCreateStep(newStepNo, params.caseId);
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
    await fetchDeleteStep(stepId, params.caseId);

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
    handleFetchCreateAttachments(params.caseId, event.dataTransfer.files);
  };

  const handleInput = (event) => {
    handleFetchCreateAttachments(params.caseId, event.target.files);
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
        const data = await fetchCase(params.caseId);
        setTestCase(data);
      } catch (error) {
        console.error("Error in effect:", error.message);
      }
    }

    fetchDataEffect();
  }, []);

  return (
    <>
      <div className="border-b-1 dark:border-neutral-700 w-full p-3 flex items-center justify-between">
        <div className="flex items-center">
          <Tooltip content="Back to cases" placement="left">
            <Button
              isIconOnly
              size="sm"
              className="rounded-full bg-neutral-50 dark:bg-neutral-600"
              onPress={() =>
                router.push(
                  `/projects/${params.projectId}/folders/${params.folderId}/cases`
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
          {isUpdating ? "Updating..." : "Update"}
        </Button>
      </div>

      <div className="p-5">
        <h6>Basic</h6>
        <Input
          size="sm"
          type="text"
          variant="bordered"
          label="Title"
          value={testCase.title}
          isInvalid={isTitleInvalid}
          errorMessage={isTitleInvalid ? "please enter title" : ""}
          onChange={(e) => {
            setTestCase({ ...testCase, title: e.target.value });
          }}
          className="mt-3"
        />

        <Textarea
          size="sm"
          variant="bordered"
          label="Description"
          placeholder="Test case description"
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
              <Chip
                className="border-none gap-1 text-default-600"
                color={priorities[testCase.priority].color}
                size="sm"
                variant="dot"
              ></Chip>
            }
            label="Priority"
            className="mt-3 max-w-xs"
          >
            {priorities.map((priority, index) => (
              <SelectItem key={priority.uid} value={index}>
                {priority.name}
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
            label="type"
            className="mt-3 max-w-xs"
          >
            {testTypes.map((type, index) => (
              <SelectItem key={type.uid} value={index}>
                {type.name}
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
            label="template"
            className="mt-3 max-w-xs"
          >
            {templates.map((template, index) => (
              <SelectItem key={template.uid} value={index}>
                {template.name}
              </SelectItem>
            ))}
          </Select>
        </div>

        <Divider className="my-6" />
        {templates[testCase.template].name === "Text" ? (
          <div>
            <h6>Test Detail</h6>
            <div className="flex">
              <Textarea
                size="sm"
                variant="bordered"
                label="PreConditions"
                placeholder="PreConditions"
                value={testCase.preConditions}
                onValueChange={(changeValue) => {
                  setTestCase({ ...testCase, preConditions: changeValue });
                }}
                className="mt-3 pe-1"
              />

              <Textarea
                size="sm"
                variant="bordered"
                label="ExpectedResults"
                placeholder="ExpectedResults"
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
              <h6>Steps</h6>
              <Button
                startContent={<Plus size={16} />}
                size="sm"
                color="primary"
                className="ms-3"
                onPress={() => onPlusClick(1)}
              >
                New Step
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
            />
          </div>
        )}

        <Divider className="my-6" />
        <h6>Attachments</h6>
        <CaseAttachmentsEditor
          attachments={testCase.Attachments}
          onAttachmentDownload={(attachmentId: number, downloadFileName: string) =>
            fetchDownloadAttachment(attachmentId, downloadFileName)
          }
          onAttachmentDelete={onAttachmentDelete}
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
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Max. file size: 50 MB
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
