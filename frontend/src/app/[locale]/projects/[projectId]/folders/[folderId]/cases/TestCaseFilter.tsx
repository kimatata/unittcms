import { useState, useEffect } from 'react';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Selection } from '@heroui/react';
import { ChevronDown, Circle } from 'lucide-react';
import { PriorityMessages } from '@/types/priority';
import { TestTypeMessages } from '@/types/testType';
import { CasesMessages } from '@/types/case';
import { priorities, testTypes } from '@/config/selection';

type TestCaseFilterProps = {
  messages: CasesMessages;
  priorityMessages: PriorityMessages;
  testTypeMessages: TestTypeMessages;
  activePriorityFilters: number[];
  activeTypeFilters: number[];
  onFilterChange: (priorities: number[], types: number[]) => void;
  handleFilterChange: () => void;
};

export default function TestCaseFilter({
  messages,
  priorityMessages,
  testTypeMessages,
  activePriorityFilters,
  activeTypeFilters,
  onFilterChange,
  handleFilterChange,
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
    handleFilterChange();
  };

  const handleClearFilter = () => {
    setSelectedPriorities(new Set([]));
    setSelectedTypes(new Set([]));
    onFilterChange([], []);
    handleFilterChange();
  };

  const isFilterEmpty =
    (selectedPriorities === 'all' || (selectedPriorities instanceof Set && selectedPriorities.size === 0)) &&
    (selectedTypes === 'all' || (selectedTypes instanceof Set && selectedTypes.size === 0));

  return (
    <div className="flex items-end border-t border-default-200 p-3">
      <div className="flex-col space-y-2 mr-2">
        <h3 className="text-default-500 text-small">{messages.priority}</h3>
        <Dropdown>
          <DropdownTrigger>
            <Button variant="bordered" endContent={<ChevronDown size={16} />}>
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
              <DropdownItem key={priority.uid} textValue={priorityMessages[priority.uid]} className="flex items-center">
                <div className="flex items-center gap-2">
                  <Circle size={8} color={priority.color} fill={priority.color} />
                  <span className="text-sm">{priorityMessages[priority.uid]}</span>
                </div>
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      <div className="flex-col space-y-2 mr-2">
        <h3 className="text-default-500 text-small">{messages.type}</h3>
        <Dropdown>
          <DropdownTrigger>
            <Button variant="bordered" endContent={<ChevronDown size={16} />}>
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

      <div className="ml-auto">
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
