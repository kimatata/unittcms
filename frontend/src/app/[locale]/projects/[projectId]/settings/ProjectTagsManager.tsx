import { useContext, useEffect, useState } from 'react';
import { addToast, Button, Card, CardBody, Input, Popover, PopoverContent, PopoverTrigger } from '@heroui/react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { SettingsMessages } from '@/types/settings';
import { TagType } from '@/types/tag';
import { TokenContext } from '@/utils/TokenProvider';
import { createTag, deleteTag, fetchTags, updateTag } from '@/utils/tagsControls';
import { logError } from '@/utils/errorHandler';

type ProjectTagsManagerProps = {
  projectId: string;
  messages: SettingsMessages;
};

export default function ProjectTagsManager({ projectId, messages }: ProjectTagsManagerProps) {
  const context = useContext(TokenContext);
  const [tags, setTags] = useState<TagType[]>([]);
  const [tagName, setTagName] = useState('');
  const [isValidTag, setIsValidTag] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingTag, setEditingTag] = useState<number | null>(null);
  const [editedTagName, setEditedTagName] = useState('');
  const [isValidEditTag, setIsValidEditTag] = useState(true);
  const [editErrorMessage, setEditErrorMessage] = useState('');
  const [openPopoverTagId, setOpenPopoverTagId] = useState<number | null>(null);

  const isProjectDeveloper = context.isProjectDeveloper(Number(projectId));

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }

      try {
        const caseTags = (await fetchTags(context.token.access_token, projectId)) || [];
        setTags(caseTags);
      } catch (error: unknown) {
        logError('Error fetching project data:', error);
      }
    }

    fetchDataEffect();
  }, [context, projectId]);

  const validateName = (name: string, messages: SettingsMessages) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return { isValid: false, errorMessage: messages.tagErrorEmpty };
    }
    if (trimmedName.length < 3) {
      return { isValid: false, errorMessage: messages.tagErrorMinLength };
    }
    if (trimmedName.length > 20) {
      return { isValid: false, errorMessage: messages.tagErrorMaxLength };
    }
    return { isValid: true, errorMessage: '' };
  };

  const onCreateTag = async () => {
    const { isValid, errorMessage } = validateName(tagName, messages);
    setIsValidTag(isValid);
    setErrorMessage(errorMessage);
    if (!isValid) return;
    try {
      const newTag = await createTag(context.token.access_token, projectId, tagName);
      setTags((prev) => [...prev, newTag]);
      setIsValidTag(true);
      setErrorMessage('');
      setTagName('');
      addToast({
        title: 'Success',
        color: 'success',
        description: messages.tagCreated,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : messages.tagErrorCreate;
      addToast({
        title: 'Error',
        color: 'danger',
        description: errorMessage,
      });
      logError('Error creating tag:', error);
    }
  };

  const onUpdateTag = async (tagId: number) => {
    const { isValid, errorMessage } = validateName(editedTagName, messages);
    setIsValidEditTag(isValid);
    setEditErrorMessage(errorMessage);
    if (!isValid) return;
    try {
      await updateTag(context.token.access_token, projectId, tagId, editedTagName);
      setTags(tags.map((tag) => (tag.id === tagId ? { ...tag, name: editedTagName } : tag)));
      setEditingTag(null);
      setEditedTagName('');
      setIsValidEditTag(true);
      setEditErrorMessage('');
      addToast({
        title: 'Success',
        color: 'success',
        description: messages.tagUpdated,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : messages.tagErrorUpdate;
      addToast({
        title: 'Error',
        color: 'danger',
        description: errorMessage,
      });
      logError('Error updating tag:', error);
    }
  };

  const onDeleteTag = async (tagId: number) => {
    try {
      await deleteTag(context.token.access_token, projectId, tagId);
      setTags(tags.filter((tag) => tag.id !== tagId));
      setOpenPopoverTagId(null);
      addToast({
        title: 'Success',
        color: 'success',
        description: messages.tagDeleted,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : messages.tagErrorDelete;
      addToast({
        title: 'Error',
        color: 'danger',
        description: errorMessage,
      });
      logError('Error deleting tag:', error);
    }
  };

  return (
    <Card>
      <CardBody>
        <div className="mb-6 flex items-baseline gap-3">
          <Input
            size="sm"
            type="text"
            placeholder={messages.tagName}
            variant="bordered"
            isInvalid={!isValidTag}
            errorMessage={errorMessage}
            value={tagName}
            onChange={(e) => {
              setTagName(e.target.value);
              const { isValid, errorMessage } = validateName(e.target.value, messages);
              setIsValidTag(isValid);
              setErrorMessage(errorMessage);
            }}
          />

          <div>
            <Button
              startContent={<Plus className="w-4 h-4" />}
              color="primary"
              size="sm"
              isDisabled={!isProjectDeveloper || !isValidTag}
              onPress={() => {
                onCreateTag();
                setTagName('');
              }}
            >
              {messages.addTag}
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          {tags.length === 0 && <div className="text-center text-gray-500 mb-3">{messages.noTagsAvailable}</div>}

          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between p-2 hover:bg-gray-100 hover:dark:bg-[#2a2a2a] transition-colors rounded-lg"
            >
              {editingTag === tag.id ? (
                <>
                  <div className="flex flex-1 items-start gap-3">
                    <Input
                      size="sm"
                      type="text"
                      variant="bordered"
                      value={editedTagName}
                      onChange={(e) => {
                        setEditedTagName(e.target.value);
                        const { isValid, errorMessage } = validateName(e.target.value, messages);
                        setIsValidEditTag(isValid);
                        setEditErrorMessage(errorMessage);
                      }}
                      isInvalid={!isValidEditTag}
                      errorMessage={editErrorMessage}
                      classNames={{
                        inputWrapper: 'h-7 flex',
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="primary"
                        isIconOnly
                        isDisabled={!isValidEditTag}
                        onPress={() => onUpdateTag(tag.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 "
                        isIconOnly
                        onPress={() => {
                          setEditingTag(null);
                          setEditedTagName('');
                          setIsValidEditTag(true);
                          setEditErrorMessage('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{tag.name}</span>
                  </div>
                  <div className="flex gap-2 transition-opacity group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      isIconOnly
                      isDisabled={!isProjectDeveloper}
                      onPress={() => {
                        setEditingTag(tag.id);
                        setEditedTagName(tag.name);
                        setIsValidEditTag(true);
                        setEditErrorMessage('');
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Popover
                      placement="top"
                      isOpen={openPopoverTagId === tag.id}
                      onOpenChange={(open) => setOpenPopoverTagId(open ? tag.id : null)}
                    >
                      <PopoverTrigger>
                        <Button
                          size="sm"
                          variant="ghost"
                          color="danger"
                          className="h-8 "
                          isIconOnly
                          isDisabled={!isProjectDeveloper}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <div className="px-1 py-2">
                          <div className="text-small font-bold">{messages.deleteTag}</div>
                          <div className="text-tiny">{messages.areYouSureDeleteTag}</div>
                          <div className="flex justify-end gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              isIconOnly
                              onPress={() => setOpenPopoverTagId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="h-8"
                              color="danger"
                              isIconOnly
                              onPress={() => onDeleteTag(tag.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
