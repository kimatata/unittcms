import { useState, useEffect } from 'react';
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Selection,
  Input,
  Spinner,
} from '@heroui/react';
import { SearchIcon, ChevronDown, Circle } from 'lucide-react';
import { PriorityMessages } from '@/types/priority';
import { TestTypeMessages } from '@/types/testType';
import { CasesMessages } from '@/types/case';
import { priorities, testTypes } from '@/config/selection';

type TestCaseFilterProps = {
  messages: CasesMessages;
  priorityMessages: PriorityMessages;
  testTypeMessages: TestTypeMessages;
  isSearching: boolean;
  localQueryTerm: string;
  activePriorityFilters: number[];
  activeTypeFilters: number[];
  onQueryChange: (query: string) => void;
  onFilterChange: (priorities: number[], types: number[]) => void;
};

export default function TestCaseFilter({
  messages,
  priorityMessages,
  testTypeMessages,
  isSearching,
  localQueryTerm,
  activePriorityFilters,
  activeTypeFilters,
  onQueryChange,
  onFilterChange,
}: TestCaseFilterProps) {
  const [selectedPriorities, setSelectedPriorities] = useState<Selection>(new Set([]));
  const [selectedTypes, setSelectedTypes] = useState<Selection>(new Set([]));

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

    onFilterChange(priorityIndices, typeIndices);
  };

  const handleClearFilter = () => {
    setSelectedPriorities(new Set([]));
    setSelectedTypes(new Set([]));
    onFilterChange([], []);
  };

  const isFilterEmpty =
    (selectedPriorities === 'all' || (selectedPriorities instanceof Set && selectedPriorities.size === 0)) &&
    (selectedTypes === 'all' || (selectedTypes instanceof Set && selectedTypes.size === 0));

  return (
    <div className="p-3">
      <div className="mb-3 space-y-1">
        <h3 className="text-default-500 text-small">{messages.caseTitle}</h3>
        <Input
          variant="bordered"
          classNames={{
            base: 'max-w-full h-8',
            mainWrapper: 'h-full',
            input: 'text-small',
          }}
          placeholder={messages.filterText}
          size="sm"
          startContent={<SearchIcon size={18} />}
          endContent={isSearching && <Spinner size="sm" />}
          type="search"
          value={localQueryTerm}
          onValueChange={onQueryChange}
          aria-label={messages.filterText}
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
      </div>
      <div className="flex justify-end">
        <Button className="me-2" size="sm" variant="light" onPress={handleClearFilter} isDisabled={isFilterEmpty}>
          {messages.clearAll}
        </Button>
        <Button size="sm" variant="solid" color="primary" onPress={handleApplyFilter} isDisabled={isFilterEmpty}>
          {messages.apply}
        </Button>
      </div>
    </div>
  );
}
