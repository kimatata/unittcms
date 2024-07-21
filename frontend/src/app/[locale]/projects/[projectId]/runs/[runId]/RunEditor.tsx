'use client';
import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { useRouter } from '@/src/navigation';
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Tooltip,
  Listbox,
  ListboxItem,
  Divider,
  Selection,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
} from '@nextui-org/react';
import { Save, ArrowLeft, Folder, ChevronDown, CopyPlus, CopyMinus, RotateCw } from 'lucide-react';
import RunProgressChart from './RunPregressDonutChart';
import TestCaseSelector from './TestCaseSelector';
import { testRunStatus } from '@/config/selection';
import { RunType, RunStatusCountType, RunMessages } from '@/types/run';
import { CaseType } from '@/types/case';
import { FolderType } from '@/types/folder';
import {
  fetchRun,
  updateRun,
  updateRunCases,
  fetchProjectCases,
  includeExcludeTestCases,
  changeStatus,
} from '../runsControl';
import { fetchFolders } from '../../folders/foldersControl';
import { TokenContext } from '@/utils/TokenProvider';
import { useTheme } from 'next-themes';
import { useFormGuard } from '@/utils/formGuard';
import { PriorityMessages } from '@/types/priority';

const defaultTestRun = {
  id: 0,
  name: '',
  configurations: 0,
  description: '',
  state: 0,
  projectId: 0,
  createdAt: '',
  updatedAt: '',
};

type Props = {
  projectId: string;
  runId: string;
  messages: RunMessages;
  priorityMessages: PriorityMessages;
  locale: string;
};

export default function RunEditor({ projectId, runId, messages, priorityMessages, locale }: Props) {
  const context = useContext(TokenContext);
  const { theme, setTheme } = useTheme();
  const [testRun, setTestRun] = useState<RunType>(defaultTestRun);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [runStatusCounts, setRunStatusCounts] = useState<RunStatusCountType[]>();
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [testCases, setTestCases] = useState<CaseType[]>([]);
  const [filteredTestCases, setFilteredTestCases] = useState<CaseType[]>([]);
  const [isNameInvalid, setIsNameInvalid] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState(false);
  const router = useRouter();
  useFormGuard(isDirty, messages.areYouSureLeave);

  const fetchRunAndStatusCount = async () => {
    const { run, statusCounts } = await fetchRun(context.token.access_token, Number(runId));
    setTestRun(run);
    setRunStatusCounts(statusCounts);
  };

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }

      try {
        await fetchRunAndStatusCount();
        const foldersData = await fetchFolders(context.token.access_token, Number(projectId));
        setFolders(foldersData);
        setSelectedFolder(foldersData[0]);

        const casesData = await fetchProjectCases(context.token.access_token, Number(projectId));
        casesData.forEach((testCase: CaseType) => {
          if (testCase.RunCases && testCase.RunCases.length > 0) {
            testCase.RunCases[0].editState = 'notChanged';
          }
        });
        setTestCases(casesData);
      } catch (error: any) {
        console.error('Error in effect:', error.message);
      }
    }

    fetchDataEffect();
  }, [context]);

  useEffect(() => {
    function onFilter() {
      if (selectedFolder && selectedFolder.id) {
        try {
          const filteredData = testCases.filter((testCase) => testCase.folderId === selectedFolder.id);
          setFilteredTestCases(filteredData);
        } catch (error: any) {
          console.error('Error fetching cases data:', error.message);
        }
      }
    }

    onFilter();
  }, [selectedFolder, testCases]);

  const handleChangeStatus = async (changeCaseId: number, newStatus: number) => {
    setIsDirty(true);
    const newTestCases = changeStatus(changeCaseId, newStatus, testCases);
    setTestCases(newTestCases);
  };

  const handleIncludeExcludeCase = async (isInclude: boolean, clickedTestCaseId: number) => {
    setIsDirty(true);
    const keys = [clickedTestCaseId];
    const newTestCases = includeExcludeTestCases(isInclude, keys, Number(runId), testCases);
    setTestCases(newTestCases);
  };

  const handleBulkIncludeExcludeCases = async (isInclude: boolean) => {
    setIsDirty(true);
    let keys: number[] = [];
    if (selectedKeys === 'all') {
      keys = testCases.map((item) => item.id);
    } else {
      keys = Array.from(selectedKeys).map(Number);
    }

    const newTestCases = includeExcludeTestCases(isInclude, keys, Number(runId), testCases);
    setTestCases(newTestCases);
    setSelectedKeys(new Set([]));
  };

  const baseClass = '';
  const selectedClass = `${baseClass} bg-neutral-200 dark:bg-neutral-700`;

  return (
    <>
      <div className="border-b-1 dark:border-neutral-700 w-full p-3 flex items-center justify-between">
        <div className="flex items-center">
          <Tooltip content={messages.backToRuns}>
            <Button
              isIconOnly
              size="sm"
              className="rounded-full bg-neutral-50 dark:bg-neutral-600"
              onPress={() => router.push(`/projects/${projectId}/runs`, { locale: locale })}
            >
              <ArrowLeft size={16} />
            </Button>
          </Tooltip>
          <h3 className="font-bold ms-2">{testRun.name}</h3>
        </div>
        <Button
          startContent={<Save size={16} />}
          size="sm"
          isDisabled={!context.isProjectReporter(Number(projectId))}
          color="primary"
          isLoading={isUpdating}
          onPress={async () => {
            setIsUpdating(true);
            await updateRun(context.token.access_token, testRun);
            await updateRunCases(context.token.access_token, Number(runId), testCases);
            setIsUpdating(false);
            setIsDirty(false);
          }}
        >
          {isUpdating ? messages.updating : messages.update}
        </Button>
      </div>

      <div className="container mx-auto max-w-5xl pt-6 px-6 flex-grow">
        <div className="flex">
          <div>
            <div className="w-96 h-72">
              <div className="flex items-center">
                <h4 className="font-bold">{messages.progress}</h4>
                <Tooltip content={messages.refresh}>
                  <Button
                    isIconOnly
                    size="sm"
                    className="rounded-full bg-transparent ms-1"
                    onPress={fetchRunAndStatusCount}
                  >
                    <RotateCw size={16} />
                  </Button>
                </Tooltip>
              </div>

              <RunProgressChart statusCounts={runStatusCounts} messages={messages} theme={theme} />
            </div>
          </div>
          <div className="flex-grow">
            <Input
              size="sm"
              type="text"
              variant="bordered"
              label={messages.title}
              value={testRun.name}
              isInvalid={isNameInvalid}
              errorMessage={isNameInvalid ? messages.pleaseEnter : ''}
              onChange={(e) => {
                setTestRun({ ...testRun, name: e.target.value });
              }}
              className="mt-3"
            />

            <Textarea
              size="sm"
              variant="bordered"
              label={messages.description}
              value={testRun.description}
              onValueChange={(changeValue) => {
                setTestRun({ ...testRun, description: changeValue });
              }}
              className="mt-3"
            />

            <div>
              <Select
                size="sm"
                variant="bordered"
                selectedKeys={[testRunStatus[testRun.state].uid]}
                onSelectionChange={(e) => {
                  const selectedUid = e.anchorKey;
                  const index = testRunStatus.findIndex((template) => template.uid === selectedUid);
                  setTestRun({ ...testRun, state: index });
                }}
                label={messages.status}
                className="mt-3 max-w-xs"
              >
                {testRunStatus.map((status, index) => (
                  <SelectItem key={status.uid} value={index}>
                    {messages[status.uid]}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <Divider className="my-6" />
        <div className="flex items-center justify-between">
          <h6 className="h-8 font-bold">{messages.selectTestCase}</h6>
          <div>
            {(selectedKeys.size > 0 || selectedKeys === 'all') && (
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    size="sm"
                    isDisabled={!context.isProjectReporter(Number(projectId))}
                    color="primary"
                    endContent={<ChevronDown size={16} />}
                  >
                    {messages.testCaseSelection}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="test case select actions">
                  <DropdownItem
                    startContent={<CopyPlus size={16} />}
                    onClick={() => handleBulkIncludeExcludeCases(true)}
                  >
                    {messages.includeInRun}
                  </DropdownItem>
                  <DropdownItem
                    startContent={<CopyMinus size={16} />}
                    onClick={() => handleBulkIncludeExcludeCases(false)}
                  >
                    {messages.excludeFromRun}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            )}
          </div>
        </div>

        <div className="mt-3 flex rounded-small border-2 dark:border-neutral-700 mb-12">
          <div className="w-3/12 border-r-1 dark:border-neutral-700">
            <Listbox aria-label="Listbox Variants" variant="light">
              {folders.map((folder, index) => (
                <ListboxItem
                  key={index}
                  onClick={() => setSelectedFolder(folder)}
                  startContent={<Folder size={20} color="#F7C24E" fill="#F7C24E" />}
                  className={selectedFolder && folder.id === selectedFolder.id ? selectedClass : baseClass}
                >
                  {folder.name}
                </ListboxItem>
              ))}
            </Listbox>
          </div>
          <div className="w-9/12">
            <TestCaseSelector
              cases={filteredTestCases}
              isDisabled={!context.isProjectReporter(Number(projectId))}
              selectedKeys={selectedKeys}
              onSelectionChange={setSelectedKeys}
              onChangeStatus={handleChangeStatus}
              onIncludeCase={(includeTestId) => handleIncludeExcludeCase(true, includeTestId)}
              onExcludeCase={(excludeCaseId) => handleIncludeExcludeCase(false, excludeCaseId)}
              messages={messages}
              priorityMessages={priorityMessages}
            />
          </div>
        </div>
      </div>
    </>
  );
}
