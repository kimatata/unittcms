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
import { RunMessages } from '@/types/run';
import { testRunCaseStatus } from '@/config/selection';
import { TagType } from '@/types/tag';
import { fetchTags } from '@/utils/tagsControls';
import { TokenContext } from '@/utils/TokenProvider';
import { logError } from '@/utils/errorHandler';
import { TestRunCaseStatusMessages } from '@/types/status';
import RunCaseStatus from './RunCaseStatus';

type TestRunFilterProps = {
  messages: RunMessages;
  testRunCaseStatusMessages: TestRunCaseStatusMessages;
  projectId: string;
  onFilterChange: (search: string, statusIndices: number[], tagIds: number[]) => void;
};

type Tag = Pick<TagType, 'id' | 'name'>;

export default function TestRunFilter({
  messages,
  testRunCaseStatusMessages,
  onFilterChange,
  projectId,
}: TestRunFilterProps) {
  const tokenContext = useContext(TokenContext);
  const [search, setSearch] = useState<string>('');
  const [selectedStatuses, setSelectedStatuses] = useState<Selection>(new Set([]));
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

  const handleStatusSelectionChange = (keys: Selection) => {
    setSelectedStatuses(keys);
  };

  const handleApplyFilter = () => {
    let statusIndices: number[] = [];
    if (selectedStatuses !== 'all' && selectedStatuses.size > 0) {
      statusIndices = Array.from(selectedStatuses)
        .map((key) => testRunCaseStatus.findIndex((status) => status.uid === key))
        .filter((index) => index !== -1);
    }

    let tagIds: number[] = [];
    if (selectedTags !== 'all' && selectedTags.size > 0) {
      tagIds = Array.from(selectedTags)
        .map((key) => parseInt(key as string))
        .filter((id) => !isNaN(id));
    }

    onFilterChange(search, statusIndices, tagIds);
  };

  const handleClearFilter = () => {
    setSelectedStatuses(new Set([]));
    setSelectedTags(new Set([]));
    onFilterChange('', [], []);
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
                {selectedStatuses === 'all' || selectedStatuses.size === 0
                  ? messages.selectStatus
                  : `${selectedStatuses.size} ${messages.selected || 'selected'}`}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Status filter"
              selectionMode="multiple"
              selectedKeys={selectedStatuses}
              onSelectionChange={handleStatusSelectionChange}
            >
              {testRunCaseStatus.map((status) => (
                <DropdownItem
                  key={status.uid}
                  textValue={testRunCaseStatusMessages[status.uid]}
                  startContent={<RunCaseStatus uid={status.uid} />}
                  className="flex items-center"
                >
                  {testRunCaseStatusMessages[status.uid]}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
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
