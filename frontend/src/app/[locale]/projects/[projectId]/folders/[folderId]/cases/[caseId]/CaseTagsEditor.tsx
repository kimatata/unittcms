'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, AutocompleteItem, Chip, addToast } from '@heroui/react';
import { useContext } from 'react';
import { createTag, fetchTags } from '@/utils/tagsControls';
import { logError } from '@/utils/errorHandler';
import { TokenContext } from '@/utils/TokenProvider';
import { CaseMessages } from '@/types/case';
import { TagType } from '@/types/tag';

type Tag = Pick<TagType, 'id' | 'name'>;

type Props = {
  projectId: string;
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
  messages: CaseMessages;
  maxTags?: number;
};

export default function CaseTagsEditor({ projectId, selectedTags, onChange, messages, maxTags = 5 }: Props) {
  const tokenContext = useContext(TokenContext);
  const [tags, setTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState('');
  const autocompleteRef = useRef<HTMLInputElement | null>(null);

  const isProjectDeveloper = tokenContext.isProjectDeveloper(Number(projectId));

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

  const availableTags = useMemo(() => {
    return tags.filter((t) => !selectedTags.some((s) => s.id === t.id));
  }, [tags, selectedTags]);

  const handleTagRemove = (tagId: number) => {
    onChange(selectedTags.filter((tag) => tag.id !== tagId));
  };

  const handleTagAdd = (tag: Tag) => {
    if (selectedTags.length >= maxTags) {
      addToast({
        title: 'Warning',
        description: messages.maxTagsLimit,
        color: 'warning',
      });
      return;
    }
    if (selectedTags.some((t) => t.id === tag.id)) return;
    onChange([...selectedTags, tag]);
    setInputValue('');
    autocompleteRef.current?.blur();
  };

  const handleCreateTag = async (name: string) => {
    if (selectedTags.length >= maxTags) {
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
      setTags((prev) => [...prev, tag]);
      onChange([...selectedTags, tag]);
      setInputValue('');
      autocompleteRef.current?.blur();
      addToast({
        title: 'Success',
        description: messages.tagCreatedAndAdded,
        color: 'success',
      });
    } catch (error) {
      logError('Error creating tag', error);
      addToast({
        title: 'Error',
        description: messages.errorCreatingTag,
        color: 'danger',
      });
    }
  };

  return (
    <div>
      <Autocomplete
        className="max-w-xs mt-2"
        size="sm"
        variant="bordered"
        inputValue={inputValue}
        label={messages.tags}
        placeholder={selectedTags.length >= maxTags ? messages.maxTagsLimit : messages.searchOrCreateTag}
        isDisabled={selectedTags.length >= maxTags}
        onInputChange={setInputValue}
        ref={autocompleteRef}
        onOpenChange={(isOpen) => !isOpen && setInputValue('')}
      >
        {inputValue.trim() &&
        availableTags.filter((tag) => tag.name.toLowerCase().includes(inputValue.trim().toLowerCase())).length === 0 ? (
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
              <AutocompleteItem
                key={tag.id}
                textValue={tag.name}
                isReadOnly={!isProjectDeveloper}
                onPress={() => handleTagAdd(tag)}
              >
                {tag.name}
              </AutocompleteItem>
            ))
        )}
      </Autocomplete>

      <div className="gap-2 flex items-center mt-3">
        <div className="flex justify-start align-center gap-1.5 flex-wrap">
          {selectedTags.length === 0 && <p className="text-foreground-500 text-xs mb-1.5">{messages.noTagsSelected}</p>}
          {selectedTags.map((tag) => (
            <Chip
              key={tag.id}
              size="md"
              onClose={!isProjectDeveloper ? undefined : () => handleTagRemove(tag.id)}
              isDisabled={!isProjectDeveloper}
            >
              {tag.name}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
