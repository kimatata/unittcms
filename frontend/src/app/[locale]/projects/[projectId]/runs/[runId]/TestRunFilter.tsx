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
import { SearchIcon, ChevronDown } from 'lucide-react';
import RunCaseStatus from './RunCaseStatus';
import { RunMessages } from '@/types/run';
import { testRunCaseStatus } from '@/config/selection';
import { TagType } from '@/types/tag';
import { fetchTags } from '@/utils/tagsControls';
import { TokenContext } from '@/utils/TokenProvider';
import { logError } from '@/utils/errorHandler';
import { TestRunCaseStatusMessages } from '@/types/status';
import { MemberType } from '@/types/user';

type TestRunFilterProps = {
  messages: RunMessages;
  testRunCaseStatusMessages: TestRunCaseStatusMessages;
  projectId: string;
  activeSearchFilter: string;
  activeStatusFilters: number[];
  activeTagFilters: number[];
  activeAssigneeFilter?: string;
  members?: MemberType[];
  onFilterChange: (search: string, statusIndices: number[], tagIds: number[], assigneeFilter?: string) => void;
};

type Tag = Pick<TagType, 'id' | 'name'>;

const ASSIGNEE_ME = 'me';
const ASSIGNEE_UNASSIGNED = 'null';

export default function TestRunFilter({
  messages,
  testRunCaseStatusMessages,
  onFilterChange,
  projectId,
  activeSearchFilter = '',
  activeStatusFilters = [],
  activeTagFilters = [],
  activeAssigneeFilter = '',
  members = [],
}: TestRunFilterProps) {
  const tokenContext = useContext(TokenContext);
  const [search, setSearch] = useState<string>('');
  const [selectedStatuses, setSelectedStatuses] = useState<Selection>(new Set([]));
  const [selectedTags, setSelectedTags] = useState<Selection>(new Set([]));
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
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
    setSearch(activeSearchFilter || '');
  }, [activeSearchFilter]);

  useEffect(() => {
    if (activeStatusFilters && activeStatusFilters.length > 0) {
      const activeKeys = activeStatusFilters.map((index) => testRunCaseStatus[index]?.uid).filter((uid) => !!uid);
      setSelectedStatuses(new Set(activeKeys as Iterable<string>));
    } else {
      setSelectedStatuses(new Set([]));
    }
  }, [activeStatusFilters]);

  useEffect(() => {
    if (activeTagFilters && activeTagFilters.length > 0) {
      const activeKeys = activeTagFilters.map((id) => id.toString());
      setSelectedTags(new Set(activeKeys));
    } else {
      setSelectedTags(new Set([]));
    }
  }, [activeTagFilters]);

  useEffect(() => {
    setSelectedAssignee(activeAssigneeFilter || '');
  }, [activeAssigneeFilter]);

  const handleStatusSelectionChange = (keys: Selection) => {
    setSelectedStatuses(keys);
  };

  const assigneeLabel = () => {
    if (!selectedAssignee) return messages.selectAssignee;
    if (selectedAssignee === ASSIGNEE_ME) return messages.assignedToMe;
    if (selectedAssignee === ASSIGNEE_UNASSIGNED) return messages.unassigned;
    const m = members.find((m) => String(m.User?.id) === selectedAssignee);
    return m?.User?.username ?? messages.selectAssignee;
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

    onFilterChange(search, statusIndices, tagIds, selectedAssignee || undefined);
  };

  const handleClearFilter = () => {
    setSearch('');
    setSelectedStatuses(new Set([]));
    setSelectedTags(new Set([]));
    setSelectedAssignee('');
    onFilterChange('', [], [], undefined);
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
      <div className="mb-3 flex justify-between gap-2 flex-wrap">
        <div className="flex-col space-y-1">
          <h3 className="text-default-500 text-small">{messages.status}</h3>
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="bordered" className="w-32" endContent={<ChevronDown size={16} />}>
                {selectedStatuses === 'all' || selectedStatuses.size === 0
                  ? messages.selectStatus
                  : `${selectedStatuses.size} ${messages.selected}`}
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

        <div className="flex-col space-y-1">
          <h3 className="text-default-500 text-small">{messages.tags}</h3>
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="bordered" className="w-32" endContent={<ChevronDown size={16} />}>
                {selectedTags === 'all' || selectedTags.size === 0
                  ? messages.selectTags
                  : `${selectedTags.size} ${messages.selected}`}
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

        <div className="flex-col space-y-1">
          <h3 className="text-default-500 text-small">{messages.filterByAssignee}</h3>
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="bordered" className="w-36" endContent={<ChevronDown size={16} />}>
                <span className="truncate max-w-24">{assigneeLabel()}</span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Assignee filter"
              selectionMode="single"
              selectedKeys={selectedAssignee ? new Set([selectedAssignee]) : new Set([])}
              onSelectionChange={(keys) => {
                if (keys === 'all') return;
                const val = Array.from(keys)[0] as string | undefined;
                setSelectedAssignee(val ?? '');
              }}
            >
              <>
                <DropdownItem key={ASSIGNEE_ME} textValue={messages.assignedToMe}>
                  {messages.assignedToMe}
                </DropdownItem>
                <DropdownItem key={ASSIGNEE_UNASSIGNED} textValue={messages.unassigned}>
                  {messages.unassigned}
                </DropdownItem>
                {members.map((m) => (
                  <DropdownItem key={String(m.User?.id)} textValue={m.User?.username}>
                    {m.User?.username}
                  </DropdownItem>
                ))}
              </>
            </DropdownMenu>
          </Dropdown>
        </div>
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
