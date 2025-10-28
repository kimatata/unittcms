'use client';
import { useState, useEffect, useContext, ChangeEvent, DragEvent, useRef, useMemo } from 'react';
import {
  Input,
  Textarea,
  Select,
  SelectItem,
  Button,
  Divider,
  Tooltip,
  addToast,
  Badge,
  Chip,
  Autocomplete,
  AutocompleteItem,
} from '@heroui/react';
import { Save, Plus, ArrowLeft, Circle } from 'lucide-react';
import CaseStepsEditor from './CaseStepsEditor';
import CaseAttachmentsEditor from './CaseAttachmentsEditor';
import { updateSteps } from './stepControl';
import { fetchCreateAttachments, fetchDownloadAttachment, fetchDeleteAttachment } from './attachmentControl';
import { fetchCase, updateCase } from '@/utils/caseControl';
import { priorities, testTypes, templates } from '@/config/selection';
import { useRouter } from '@/src/i18n/routing';
import { TokenContext } from '@/utils/TokenProvider';
import { useFormGuard } from '@/utils/formGuard';
import { CaseType, AttachmentType, CaseMessages, StepType } from '@/types/case';
import { PriorityMessages } from '@/types/priority';
import { TestTypeMessages } from '@/types/testType';
import { logError } from '@/utils/errorHandler';
import { createTag, fetchTags } from '@/utils/tagsControls';
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
  const [plusCount, setPlusCount] = useState<number>(0);
  const [isDirty, setIsDirty] = useState(false);
  const [tags, setTags] = useState<{ id: number; name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<{ id: number; name: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const autocompleteRef = useRef<any>(null);
  const max_tags = 5;

  const availableTags = useMemo(() => {
    return tags.filter((t) => !selectedTags.some((s) => s.id === t.id));
  }, [tags, selectedTags]);

  const router = useRouter();
  useFormGuard(isDirty, messages.areYouSureLeave);

  useEffect(() => {
    const fetchDataEffect = async () => {
      try {
        const tagsResponse = (await fetchTags(tokenContext.token.access_token, projectId)) || [];
        setTags(tagsResponse);
      } catch (error: unknown) {
        logError('Error fetching case tags', error);
        addToast({
          title: 'Error',
          description: 'Error fetching tags',
          color: 'danger',
        });
      }
    };
    fetchDataEffect();
  }, [projectId, tokenContext.token.access_token]);

  const handleTagRemove = (tagId: number) => {
    setSelectedTags((prev) => prev.filter((tag) => tag.id !== tagId));
    setIsDirty(true);
  };

  const handleTagAdd = (tag: { id: number; name: string }) => {
    if (selectedTags.length >= max_tags) {
      addToast({
        title: 'Warning',
        description: messages.maxTagsLimit,
        color: 'warning',
      });
      return;
    }
    if (selectedTags.some((t) => t.id === tag.id)) return;

    setSelectedTags([...selectedTags, tag]);
    setIsDirty(true);
    setInputValue('');
    if (autocompleteRef.current) {
      autocompleteRef.current.blur();
    }
  };

  const handleCreateTag = async (name: string) => {
    if (selectedTags.length >= max_tags) {
      addToast({
        title: 'Warning',
        description: messages.maxTagsLimit,
        color: 'warning',
      });
      return;
    }
    const normalizedName = name.trim().toLowerCase();
    if (
      tags.some((tag) => tag.name.toLowerCase() === normalizedName) ||
      selectedTags.some((tag) => tag.name.toLowerCase() === normalizedName)
    ) {
      addToast({
        title: 'Warning',
        description: messages.tagAlreadyExists,
        color: 'warning',
      });
      return;
    }

    try {
      const tag = await createTag(tokenContext.token.access_token, projectId, name);
      setTags((prev) => [...prev, tag]); // só adiciona em tags
      setSelectedTags((prev) => [...prev, tag]); // e seleciona
      setIsDirty(true);
      setInputValue('');
      if (autocompleteRef.current) {
        autocompleteRef.current.blur();
      }
      addToast({
        title: 'Success',
        description: messages.tagCreatedAndAdded,
        color: 'success',
      });
    } catch (error: unknown) {
      logError('Error creating tag', error);
      addToast({
        title: 'Error',
        description: messages.errorCreatingTag,
        color: 'danger',
      });
    }
  };

  const onPlusClick = async (newStepNo: number) => {
    setIsDirty(true);
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
    setIsDirty(true);

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

    if (testCase.Steps) {
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
    }
  };

  useEffect(() => {
    const fetchAndSetCase = async () => {
      if (!tokenContext.isSignedIn()) return;
      try {
        const data = await fetchCase(tokenContext.token.access_token, Number(caseId));
        data.Steps.forEach((step: StepType) => {
          step.editState = 'notChanged';
        });
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
        <div className="flex items-center">
          <Button
            startContent={
              <Badge isInvisible={!isDirty} color="danger" size="sm" content="" shape="circle">
                <Save size={16} />
              </Badge>
            }
            size="sm"
            isDisabled={!tokenContext.isProjectDeveloper(Number(projectId))}
            color="primary"
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

                addToast({
                  title: 'Info',
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

        <Autocomplete
          className="max-w-xs mt-2"
          size="sm"
          variant="bordered"
          inputValue={inputValue}
          label={messages.tags}
          placeholder={selectedTags.length >= max_tags ? messages.maxTagsLimit : messages.searchOrCreateTag}
          isDisabled={selectedTags.length >= max_tags}
          onInputChange={(value) => setInputValue(value)}
          ref={autocompleteRef}
          onOpenChange={(isOpen) => {
            if (!isOpen) setInputValue('');
          }}
        >
          {inputValue.trim() &&
          availableTags.filter((tag) => tag.name.toLowerCase().includes(inputValue.trim().toLowerCase())).length ===
            0 ? (
            <AutocompleteItem
              key="create-tag"
              textValue={inputValue.trim()}
              onPress={() => handleCreateTag(inputValue.trim())}
              className="text-primary"
            >
              {`${messages.createTag} "${inputValue.trim()}"`}
            </AutocompleteItem>
          ) : (
            availableTags
              .filter((tag) => tag.name.toLowerCase().includes(inputValue.trim().toLowerCase()))
              .map((tag) => (
                <AutocompleteItem key={tag.id} textValue={tag.name} onPress={() => handleTagAdd(tag)}>
                  {tag.name}
                </AutocompleteItem>
              ))
          )}
        </Autocomplete>

        <div className="gap-2 flex items-center mt-3">
          <div className="flex justify-start align-center gap-1.5 flex-wrap">
            {selectedTags.length === 0 && (
              <p className="text-foreground-500 text-xs mb-1.5">{messages.noTagsSelected}</p>
            )}
            {selectedTags.map((tag) => (
              <Chip
                key={tag.id}
                size="md"
                onClose={() => handleTagRemove(tag.id)}
                isCloseable={tokenContext.isProjectDeveloper(Number(projectId))}
              >
                {tag.name}
              </Chip>
            ))}
          </div>
        </div>

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
            <div className="flex items-center mb-3">
              <h6 className="font-bold">{messages.steps}</h6>
              <Button
                startContent={<Plus size={16} />}
                size="sm"
                isDisabled={!tokenContext.isProjectDeveloper(Number(projectId))}
                color="primary"
                className="ms-3"
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
          </div>
        )}

        <Divider className="my-6" />
        <h6 className="font-bold">{messages.attachments}</h6>
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
        )}
      </div>
    </>
  );
}
