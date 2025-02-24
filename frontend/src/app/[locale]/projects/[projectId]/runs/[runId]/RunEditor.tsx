'use client';
import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { useRouter } from '@/src/i18n/routing';
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
  addToast,
} from '@heroui/react';
import { Save, Circle, ArrowLeft, Folder, ChevronDown, CopyPlus, CopyMinus, RotateCw } from 'lucide-react';
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
import { RunStatusMessages, TestRunCaseStatusMessages } from '@/types/status';
import { TestTypeMessages } from '@/types/testType';

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
  runStatusMessages: RunStatusMessages;
  testRunCaseStatusMessages: TestRunCaseStatusMessages;
  priorityMessages: PriorityMessages;
  testTypeMessages: TestTypeMessages;
  locale: string;
};

export default function RunEditor({
  projectId,
  runId,
  messages,
  runStatusMessages,
  testRunCaseStatusMessages,
  priorityMessages,
  testTypeMessages,
  locale,
}: Props) {
  const tokenContext = useContext(TokenContext);
  const { theme, setTheme } = useTheme();
  const [testRun, setTestRun] = useState<RunType>(defaultTestRun);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [runStatusCounts, setRunStatusCounts] = useState<RunStatusCountType[]>([]);
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
    const { run, statusCounts } = await fetchRun(tokenContext.token.access_token, Number(runId));
    setTestRun(run);
    setRunStatusCounts(statusCounts);
  };

  const initTestCases = async () => {
    const casesData = await fetchProjectCases(tokenContext.token.access_token, Number(projectId));
    casesData.forEach((testCase: CaseType) => {
      if (testCase.RunCases && testCase.RunCases.length > 0) {
        testCase.RunCases[0].editState = 'notChanged';
      }
    });
    setTestCases(casesData);
  };

  useEffect(() => {
    async function fetchDataEffect() {
      if (!tokenContext.isSignedIn()) {
        return;
      }

      try {
        await fetchRunAndStatusCount();
        const foldersData = await fetchFolders(tokenContext.token.access_token, Number(projectId));
        setFolders(foldersData);
        setSelectedFolder(foldersData[0]);
        initTestCases();
      } catch (error: any) {
        console.error('Error in effect:', error.message);
      }
    }

    fetchDataEffect();
  }, [tokenContext]);

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
      keys = filteredTestCases.map((item) => item.id);
    } else {
      keys = Array.from(selectedKeys).map(Number);
    }

    const newTestCases = includeExcludeTestCases(isInclude, keys, Number(runId), testCases);
    setTestCases(newTestCases);
    setSelectedKeys(new Set([]));
  };

  const onSave = async () => {
    setIsUpdating(true);
    await updateRun(tokenContext.token.access_token, testRun);
    await updateRunCases(tokenContext.token.access_token, Number(runId), testCases);
    await initTestCases();

    addToast({
      title: 'Info',
      description: messages.updatedTestRun,
    });
    setIsUpdating(false);
    setIsDirty(false);
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
        <div className="flex items-center">
          {isDirty && <Circle size={8} color="#525252" fill="#525252" className="me-1" />}
          <Button
            startContent={<Save size={16} />}
            size="sm"
            isDisabled={!tokenContext.isProjectReporter(Number(projectId))}
            color="primary"
            isLoading={isUpdating}
            onPress={onSave}
          >
            {isUpdating ? messages.updating : messages.update}
          </Button>
        </div>
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

              <RunProgressChart
                statusCounts={runStatusCounts}
                testRunCaseStatusMessages={testRunCaseStatusMessages}
                theme={theme}
              />
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
                onSelectionChange={(newSelection) => {
                  if (newSelection !== 'all' && newSelection.size !== 0) {
                    const selectedUid = Array.from(newSelection)[0];
                    const index = testRunStatus.findIndex((template) => template.uid === selectedUid);
                    setTestRun({ ...testRun, state: index });
                  }
                }}
                label={messages.status}
                className="mt-3 max-w-xs"
              >
                {testRunStatus.map((status) => (
                  <SelectItem key={status.uid}>{runStatusMessages[status.uid]}</SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <Divider className="my-6" />
        <div className="flex items-center justify-between">
          <h6 className="h-8 font-bold">{messages.selectTestCase}</h6>
          <div>
            {(selectedKeys === 'all' || selectedKeys.size > 0) && (
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    size="sm"
                    isDisabled={!tokenContext.isProjectReporter(Number(projectId))}
                    color="primary"
                    endContent={<ChevronDown size={16} />}
                  >
                    {messages.testCaseSelection}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="test case select actions">
                  <DropdownItem
                    key="include"
                    startContent={<CopyPlus size={16} />}
                    onPress={() => handleBulkIncludeExcludeCases(true)}
                  >
                    {messages.includeInRun}
                  </DropdownItem>
                  <DropdownItem
                    key="exclude"
                    startContent={<CopyMinus size={16} />}
                    onPress={() => handleBulkIncludeExcludeCases(false)}
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
                  onPress={() => {
                    setSelectedKeys(new Set([])); // reset selection
                    setSelectedFolder(folder);
                  }}
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
              isDisabled={!tokenContext.isProjectReporter(Number(projectId))}
              selectedKeys={selectedKeys}
              onSelectionChange={setSelectedKeys}
              onChangeStatus={handleChangeStatus}
              onIncludeCase={(includeTestId) => handleIncludeExcludeCase(true, includeTestId)}
              onExcludeCase={(excludeCaseId) => handleIncludeExcludeCase(false, excludeCaseId)}
              messages={messages}
              testRunCaseStatusMessages={testRunCaseStatusMessages}
              priorityMessages={priorityMessages}
              testTypeMessages={testTypeMessages}
            />
          </div>
        </div>
      </div>
    </>
  );
}
