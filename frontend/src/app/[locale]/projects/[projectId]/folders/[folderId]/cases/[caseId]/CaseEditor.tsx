'use client';
import { useState, useEffect, useContext, ChangeEvent, DragEvent } from 'react';
import { Input, Select, SelectItem, Button, Tooltip, addToast, Badge } from '@heroui/react';
import { Save, Plus, ArrowLeft, Circle } from 'lucide-react';
import MarkdownEditor from '@/components/MarkdownEditor';
import CaseStepsEditor from './CaseStepsEditor';
import CaseAttachmentsEditor from './CaseAttachmentsEditor';
import { updateSteps } from './stepControl';
import { fetchCreateAttachments, fetchDownloadAttachment, fetchDeleteAttachment } from './attachmentControl';
import CaseTagsEditor from './CaseTagsEditor';
import { fetchCase, updateCase } from '@/utils/caseControl';
import { priorities, testTypes, templates } from '@/config/selection';
import { useRouter } from '@/src/i18n/routing';
import { TokenContext } from '@/utils/TokenProvider';
import { useFormGuard } from '@/utils/formGuard';
import { CaseType, AttachmentType, CaseMessages, StepType } from '@/types/case';
import { PriorityMessages } from '@/types/priority';
import { TestTypeMessages } from '@/types/testType';
import { logError } from '@/utils/errorHandler';
import { updateCaseTags } from '@/utils/caseTagsControls';

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
  Tags: [],
};

type Props = {
  projectId: string;
  folderId: string;
  caseId: string;
  messages: CaseMessages;
  testTypeMessages: TestTypeMessages;
  priorityMessages: PriorityMessages;
  locale: string;
};

export default function CaseEditor({
  projectId,
  folderId,
  caseId,
  messages,
  testTypeMessages,
  priorityMessages,
  locale,
}: Props) {
  const tokenContext = useContext(TokenContext);
  const [testCase, setTestCase] = useState<CaseType>(defaultTestCase);
  const [isTitleInvalid] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [idCounter, setIdCounter] = useState<number>(0);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedTags, setSelectedTags] = useState<{ id: number; name: string }[]>([]);

  const router = useRouter();
  useFormGuard(isDirty, messages.areYouSureLeave);

  const onPlusClick = async (newStepNo: number) => {
    if (!testCase.Steps) {
      return;
    }
    setIsDirty(true);
    const nextId = idCounter + 1;
    const newStep: StepType = {
      // hypothetical ID
      id: nextId,
      step: '',
      result: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      caseSteps: {
        stepNo: newStepNo,
      },
      uid: `uid${nextId}`,
      editState: 'new',
    };

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
    setIdCounter(nextId);
  };

  const onDeleteClick = async (stepId: number) => {
    setIsDirty(true);
    if (!testCase.Steps) {
      return;
    }
    // find deletedStep's stepNo

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
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (event.dataTransfer) {
      const filesArray = Array.from(event.dataTransfer.files);
      handleFetchCreateAttachments(Number(caseId), filesArray);
    }
  };

  const handleInput = (event: ChangeEvent) => {
    if (event.target) {
      const input = event.target as HTMLInputElement;
      if (input.files) {
        const filesArray = Array.from(input.files);
        handleFetchCreateAttachments(Number(caseId), filesArray);
      }
    }
  };

  const handleFetchCreateAttachments = async (caseId: number, files: File[]) => {
    const newAttachments = await fetchCreateAttachments(caseId, files);

    if (newAttachments) {
      const newAttachmentsWithJoinTable = [];
      newAttachments.forEach((attachment: AttachmentType) => {
        attachment.caseAttachments = {
          createdAt: new Date(),
          updatedAt: new Date(),
          caseId: 0,
          attachmentId: attachment.id,
        };
        newAttachmentsWithJoinTable.push(attachment);
      });
      const updatedAttachments = testCase.Attachments;
      if (updatedAttachments) {
        updatedAttachments.push(...newAttachments);

        setTestCase({
          ...testCase,
          Attachments: updatedAttachments,
        });
      }
    }
  };

  const onAttachmentDelete = async (attachmentId: number) => {
    await fetchDeleteAttachment(attachmentId);
    if (testCase.Attachments) {
      const filteredAttachments = testCase.Attachments.filter((attachment) => attachment.id !== attachmentId);

      setTestCase({
        ...testCase,
        Attachments: filteredAttachments,
      });
    }
  };

  const onStepUpdate = (stepId: number, changeStep: StepType) => {
    if (changeStep.editState === 'notChanged') {
      changeStep.editState = 'changed';
    }

    if (!testCase.Steps) {
      return;
    }

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
  };

  useEffect(() => {
    const fetchAndSetCase = async () => {
      if (!tokenContext.isSignedIn()) return;
      try {
        const data = await fetchCase(tokenContext.token.access_token, Number(caseId));
        data.Steps.forEach((step: StepType) => {
          step.editState = 'notChanged';
        });

        // set idCounter to the max step id to avoid id conflict for new steps
        // id is not reflected on database
        const maxStepId = data.Steps.reduce((maxId: number, step: StepType) => Math.max(maxId, step.id), 0);
        setIdCounter(maxStepId);
        setTestCase(data);
        if (data.Tags) {
          setSelectedTags(Array.isArray(data.Tags) ? data.Tags : []);
        }
      } catch (error: unknown) {
        logError('Error fetching case data', error);
      }
    };
    fetchAndSetCase();
  }, [tokenContext, caseId]);

  return (
    <>
      <div className="w-full px-6 py-4 flex items-center justify-between bg-white/70 backdrop-blur-xl border-b border-indigo-100/30">
        <div className="flex items-center gap-3">
          <Tooltip content={messages.backToCases} placement="left">
            <button
              title={messages.backToCases}
              className="p-2 text-slate-400 hover:text-[#4953ac] hover:bg-indigo-50 rounded-lg transition-all"
              onClick={() => router.push(`/projects/${projectId}/folders/${folderId}/cases`, { locale: locale })}
            >
              <ArrowLeft size={18} />
            </button>
          </Tooltip>
          <h2 className="text-2xl font-extrabold text-[#2b2f37] tracking-tight">{testCase.title}</h2>
        </div>
        <div className="flex items-center">
          <Button
            startContent={
              <Badge isInvisible={!isDirty} color="danger" size="sm" content="" shape="circle">
                <Save size={16} />
              </Badge>
            }
            size="sm"
            isDisabled={!tokenContext.isProjectDeveloper(Number(projectId))}
            className="bg-gradient-to-r from-[#4953ac] to-[#652fe7] text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 px-5"
            isLoading={isUpdating}
            onPress={async () => {
              setIsUpdating(true);
              try {
                await updateCase(tokenContext.token.access_token, testCase);
                if (testCase.Steps) {
                  await updateSteps(tokenContext.token.access_token, Number(caseId), testCase.Steps);
                }

                const tagIds = selectedTags.map((tag) => tag.id);
                await updateCaseTags(tokenContext.token.access_token, Number(caseId), tagIds, projectId);

                // Re-fetch the case to get authoritative step IDs and reset editState.
                // Without this, 'new' steps remain marked as 'new' in local state and
                // would be re-created on a subsequent save (causing duplication).
                const refreshed = await fetchCase(tokenContext.token.access_token, Number(caseId));
                if (refreshed?.Steps) {
                  const refreshedSteps = refreshed.Steps.map((step: StepType) => ({
                    ...step,
                    editState: 'notChanged' as const,
                  }));
                  refreshedSteps.sort((a: StepType, b: StepType) => a.caseSteps.stepNo - b.caseSteps.stepNo);
                  const maxStepId = refreshedSteps.reduce(
                    (maxId: number, step: StepType) => Math.max(maxId, step.id),
                    0
                  );
                  setIdCounter(maxStepId);
                  setTestCase((prev) => ({ ...prev, Steps: refreshedSteps }));
                }

                addToast({
                  title: 'Success',
                  color: 'success',
                  description: messages.updatedTestCase,
                });
                setIsDirty(false);
              } catch (error) {
                logError('Error updating test case', error);
                addToast({
                  title: 'Error',
                  description: messages.errorUpdatingTestCase,
                  color: 'danger',
                });
              } finally {
                setIsUpdating(false);
              }
            }}
          >
            {isUpdating ? messages.updating : messages.update}
          </Button>
        </div>
      </div>

      <div className="p-6 mx-6 my-6 bg-white rounded-2xl shadow-sm">
        <h6 className="font-bold text-[#2b2f37]">{messages.basic}</h6>
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

        <MarkdownEditor
          label={messages.description}
          placeholder={messages.testCaseDescription}
          value={testCase.description}
          isDisabled={!tokenContext.isProjectDeveloper(Number(projectId))}
          onValueChange={(changeValue) => {
            setIsDirty(true);
            setTestCase({ ...testCase, description: changeValue });
          }}
        />

        <CaseTagsEditor
          projectId={projectId}
          selectedTags={selectedTags}
          onChange={(tags) => {
            setSelectedTags(tags);
            setIsDirty(true);
          }}
          messages={messages}
        />

        <div>
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[priorities[testCase.priority].uid]}
            onSelectionChange={(newSelection) => {
              if (newSelection !== 'all' && newSelection.size !== 0) {
                const selectedUid = Array.from(newSelection)[0];
                const index = priorities.findIndex((priority) => priority.uid === selectedUid);
                setTestCase({ ...testCase, priority: index });
              }
            }}
            startContent={
              <Circle size={8} color={priorities[testCase.priority].color} fill={priorities[testCase.priority].color} />
            }
            label={messages.priority}
            className="mt-3 max-w-xs"
          >
            {priorities.map((priority) => (
              <SelectItem key={priority.uid}>{priorityMessages[priority.uid]}</SelectItem>
            ))}
          </Select>
        </div>

        <div>
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[testTypes[testCase.type].uid]}
            onSelectionChange={(newSelection) => {
              if (newSelection !== 'all' && newSelection.size !== 0) {
                const selectedUid = Array.from(newSelection)[0];
                const index = testTypes.findIndex((type) => type.uid === selectedUid);
                setTestCase({ ...testCase, type: index });
              }
            }}
            label={messages.type}
            className="mt-3 max-w-xs"
          >
            {testTypes.map((type) => (
              <SelectItem key={type.uid}>{testTypeMessages[type.uid]}</SelectItem>
            ))}
          </Select>
        </div>

        <div>
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[templates[testCase.template].uid]}
            onSelectionChange={(newSelection) => {
              if (newSelection !== 'all' && newSelection.size !== 0) {
                const selectedUid = Array.from(newSelection)[0];
                const index = templates.findIndex((template) => template.uid === selectedUid);
                setTestCase({ ...testCase, template: index });
              }
            }}
            label={messages.template}
            className="mt-3 max-w-xs"
          >
            {templates.map((template) => (
              <SelectItem key={template.uid}>{messages[template.uid]}</SelectItem>
            ))}
          </Select>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
        {templates[testCase.template].uid === 'text' ? (
          <div>
            <h6 className="font-bold text-[#2b2f37]">{messages.testDetail}</h6>
            <div className="flex gap-2">
              <div className="flex-1">
                <MarkdownEditor
                  label={messages.preconditions}
                  value={testCase.preConditions}
                  isDisabled={!tokenContext.isProjectDeveloper(Number(projectId))}
                  onValueChange={(changeValue) => {
                    setIsDirty(true);
                    setTestCase({ ...testCase, preConditions: changeValue });
                  }}
                />
              </div>
              <div className="flex-1">
                <MarkdownEditor
                  label={messages.expectedResult}
                  value={testCase.expectedResults}
                  isDisabled={!tokenContext.isProjectDeveloper(Number(projectId))}
                  onValueChange={(changeValue) => {
                    setIsDirty(true);
                    setTestCase({ ...testCase, expectedResults: changeValue });
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center mb-3">
              <h6 className="font-bold text-[#2b2f37]">{messages.steps}</h6>
              <Button
                startContent={<Plus size={16} />}
                size="sm"
                isDisabled={!tokenContext.isProjectDeveloper(Number(projectId))}
                color="primary"
                className="ms-3 bg-gradient-to-r from-[#4953ac] to-[#652fe7] text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20"
                onPress={() => onPlusClick(1)}
              >
                {messages.newStep}
              </Button>
            </div>
            {testCase.Steps && (
              <CaseStepsEditor
                isDisabled={!tokenContext.isProjectDeveloper(Number(projectId))}
                steps={testCase.Steps}
                onStepUpdate={onStepUpdate}
                onStepPlus={onPlusClick}
                onStepDelete={onDeleteClick}
                messages={messages}
              />
            )}

            <Textarea
              size="sm"
              variant="bordered"
              label={messages.overallExpectedResult}
              value={testCase.expectedResults}
              onValueChange={(changeValue) => {
                setTestCase({ ...testCase, expectedResults: changeValue });
              }}
              className="mt-3"
            />
          </div>
        )}

        </div>
        <div className="mt-8 pt-6 border-t border-slate-100">
        <h6 className="font-bold text-[#2b2f37]">{messages.attachments}</h6>
        {testCase.Attachments && (
          <CaseAttachmentsEditor
            isDisabled={!tokenContext.isProjectDeveloper(Number(projectId))}
            attachments={testCase.Attachments}
            onAttachmentDownload={(attachmentId: number, downloadFileName: string) =>
              fetchDownloadAttachment(attachmentId, downloadFileName)
            }
            onAttachmentDelete={onAttachmentDelete}
            onFilesDrop={handleDrop}
            onFilesInput={handleInput}
            messages={messages}
          />
        )}        </div>      </div>
    </>
  );
}
