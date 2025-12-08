import { useState, useEffect, useContext } from 'react';
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Selection,
  Input,
  addToast,
} from '@heroui/react';
import { SearchIcon, ChevronDown, Circle } from 'lucide-react';
import { PriorityMessages } from '@/types/priority';
import { TestTypeMessages } from '@/types/testType';
import { CasesMessages } from '@/types/case';
import { priorities, testTypes } from '@/config/selection';
import { TagType } from '@/types/tag';
import { fetchTags } from '@/utils/tagsControls';
import { TokenContext } from '@/utils/TokenProvider';
import { logError } from '@/utils/errorHandler';

type TestCaseFilterProps = {
  messages: CasesMessages;
  priorityMessages: PriorityMessages;
  testTypeMessages: TestTypeMessages;
  activeSearchFilter: string;
  activePriorityFilters: number[];
  activeTypeFilters: number[];
  activeTagFilters: number[];
  projectId: string;
  onFilterChange: (search: string, priorities: number[], types: number[], tags: number[]) => void;
};

type Tag = Pick<TagType, 'id' | 'name'>;

export default function TestCaseFilter({
  messages,
  priorityMessages,
  testTypeMessages,
  activeSearchFilter,
  activePriorityFilters,
  activeTypeFilters,
  activeTagFilters,
  onFilterChange,
  projectId,
}: TestCaseFilterProps) {
  const tokenContext = useContext(TokenContext);
  const [search, setSearch] = useState<string>('');
  const [selectedPriorities, setSelectedPriorities] = useState<Selection>(new Set([]));
  const [selectedTypes, setSelectedTypes] = useState<Selection>(new Set([]));
  const [selectedTags, setSelectedTags] = useState<Selection>(new Set([]));
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    const fetchDataEffect = async () => {
      try {
        const tagsResponse = (await fetchTags(tokenContext.token.access_token, projectId)) || [];
        setTags(tagsResponse);
      } catch (error) {
        logError('Error fetching case tags', error);
        addToast({ title: 'Error', description: 'Error fetching tags', color: 'danger' });
      }
    };
    fetchDataEffect();
  }, [projectId, tokenContext.token.access_token]);

  useEffect(() => {
    if (activeTagFilters.length > 0) {
      const activeKeys = activeTagFilters.map((id) => id.toString());
      setSelectedTags(new Set(activeKeys));
    } else {
      setSelectedTags(new Set([]));
    }
  }, [activeTagFilters]);

  useEffect(() => {
    setSearch(activeSearchFilter);
  }, [activeSearchFilter]);

  useEffect(() => {
    if (activePriorityFilters.length > 0) {
      const activeKeys = activePriorityFilters.map((index) => priorities[index]?.uid).filter(Boolean);
      setSelectedPriorities(new Set(activeKeys));
    } else {
      setSelectedPriorities(new Set([]));
    }
  }, [activePriorityFilters]);

  useEffect(() => {
    if (activeTypeFilters.length > 0) {
      const activeKeys = activeTypeFilters.map((index) => testTypes[index]?.uid).filter(Boolean);
      setSelectedTypes(new Set(activeKeys));
    } else {
      setSelectedTypes(new Set([]));
    }
  }, [activeTypeFilters]);

  const handlePrioritySelectionChange = (keys: Selection) => {
    setSelectedPriorities(keys);
  };

  const handleTypeSelectionChange = (keys: Selection) => {
    setSelectedTypes(keys);
  };

  const handleApplyFilter = () => {
    let priorityIndices: number[] = [];
    if (selectedPriorities !== 'all' && selectedPriorities.size > 0) {
      priorityIndices = Array.from(selectedPriorities)
        .map((key) => priorities.findIndex((priority) => priority.uid === key))
        .filter((index) => index !== -1);
    }

    let typeIndices: number[] = [];
    if (selectedTypes !== 'all' && selectedTypes.size > 0) {
      typeIndices = Array.from(selectedTypes)
        .map((key) => testTypes.findIndex((type) => type.uid === key))
        .filter((index) => index !== -1);
    }

    let tagIds: number[] = [];
    if (selectedTags !== 'all' && selectedTags.size > 0) {
      tagIds = Array.from(selectedTags)
        .map((key) => parseInt(key as string))
        .filter((id) => !isNaN(id));
    }

    onFilterChange(search, priorityIndices, typeIndices, tagIds);
  };

  const handleClearFilter = () => {
    setSelectedPriorities(new Set([]));
    setSelectedTypes(new Set([]));
    onFilterChange('', [], [], []);
  };

  return (
    <div className="p-3">
      <div className="mb-3 space-y-1">
        <h3 className="text-default-500 text-small">{messages.caseTitleOrDescription}</h3>
        <Input
          variant="bordered"
          classNames={{
            base: 'max-w-full h-8',
            mainWrapper: 'h-full',
            input: 'text-small',
          }}
          size="sm"
          startContent={<SearchIcon size={18} />}
          type="search"
          value={search}
          onValueChange={setSearch}
          maxLength={100}
        />
      </div>
      <div className="mb-3 flex justify-between gap-2">
        <div className="flex-col space-y-1">
          <h3 className="text-default-500 text-small">{messages.priority}</h3>
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="bordered" className="w-32" endContent={<ChevronDown size={16} />}>
                {selectedPriorities === 'all' || selectedPriorities.size === 0
                  ? messages.selectPriorities
                  : `${selectedPriorities.size} ${messages.selected || 'selected'}`}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Priority filter"
              selectionMode="multiple"
              selectedKeys={selectedPriorities}
              onSelectionChange={handlePrioritySelectionChange}
            >
              {priorities.map((priority) => (
                <DropdownItem
                  key={priority.uid}
                  textValue={priorityMessages[priority.uid]}
                  className="flex items-center"
                >
                  <div className="flex items-center gap-2">
                    <Circle size={8} color={priority.color} fill={priority.color} />
                    <span className="text-sm">{priorityMessages[priority.uid]}</span>
                  </div>
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
        <div className="flex-col space-y-1">
          <h3 className="text-default-500 text-small">{messages.type}</h3>
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="bordered" className="w-32" endContent={<ChevronDown size={16} />}>
                {selectedTypes === 'all' || selectedTypes.size === 0
                  ? messages.selectTypes || 'Select Types'
                  : `${selectedTypes.size} ${messages.selected || 'selected'}`}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              className="max-h-[50vh] overflow-y-auto"
              aria-label="Type filter"
              selectionMode="multiple"
              selectedKeys={selectedTypes}
              onSelectionChange={handleTypeSelectionChange}
            >
              {testTypes.map((type) => (
                <DropdownItem key={type.uid} textValue={testTypeMessages[type.uid]} className="flex items-center">
                  <span className="text-sm">{testTypeMessages[type.uid]}</span>
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
        <div className="flex-col space-y-1">
          <h3 className="text-default-500 text-small"></h3>
        </div>
      </div>

      <div className="mb-3 space-y-1">
        <h3 className="text-default-500 text-small">{messages.tags}</h3>
        <Dropdown>
          <DropdownTrigger>
            <Button size="sm" variant="bordered" className="w-32" endContent={<ChevronDown size={16} />}>
              {selectedTags === 'all' || selectedTags.size === 0
                ? messages.selectTags
                : `${selectedTags.size} ${messages.selected || 'selected'}`}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            className="max-h-[50vh] overflow-y-auto"
            aria-label="Tag filter"
            selectionMode="multiple"
            selectedKeys={selectedTags}
            onSelectionChange={setSelectedTags}
          >
            {tags.map((tag) => (
              <DropdownItem key={tag.id.toString()} textValue={tag.name}>
                <span className="text-sm">{tag.name}</span>
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>
      <div className="flex justify-end">
        <Button className="me-2" size="sm" variant="light" onPress={handleClearFilter}>
          {messages.clearAll}
        </Button>
        <Button size="sm" variant="solid" color="primary" onPress={handleApplyFilter}>
          {messages.apply}
        </Button>
      </div>
    </div>
  );
}
