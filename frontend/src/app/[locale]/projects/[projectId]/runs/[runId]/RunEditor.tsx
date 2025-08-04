'use client';
import { useState, useEffect, useContext } from 'react';
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Tooltip,
  Divider,
  Selection,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  addToast,
  ButtonGroup,
  Badge,
} from '@heroui/react';
import {
  Save,
  ArrowLeft,
  ChevronDown,
  CopyPlus,
  CopyMinus,
  RotateCw,
  FileDown,
  FileSpreadsheet,
  FileCode,
  FileJson,
  ChevronRight,
  Folder,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { NodeApi, Tree } from 'react-arborist';
import {
  fetchRun,
  updateRun,
  updateRunCases,
  fetchProjectCases,
  includeExcludeTestCases,
  changeStatus,
  exportRun,
} from '../runsControl';
import { fetchFolders } from '../../folders/foldersControl';
import RunProgressChart from './RunPregressDonutChart';
import TestCaseSelector from './TestCaseSelector';
import { useRouter } from '@/src/i18n/routing';
import { testRunStatus } from '@/config/selection';
import { RunType, RunStatusCountType, RunMessages } from '@/types/run';
import { CaseType } from '@/types/case';
import { TreeNodeData } from '@/types/folder';
import { TokenContext } from '@/utils/TokenProvider';
import { useFormGuard } from '@/utils/formGuard';
import { PriorityMessages } from '@/types/priority';
import { RunStatusMessages, TestRunCaseStatusMessages } from '@/types/status';
import { TestTypeMessages } from '@/types/testType';
import { logError } from '@/utils/errorHandler';
import TreeItem from '@/components/TreeItem';
import { buildFolderTree } from '@/utils/buildFolderTree';

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
  const { theme } = useTheme();
  const [testRun, setTestRun] = useState<RunType>(defaultTestRun);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [runStatusCounts, setRunStatusCounts] = useState<RunStatusCountType[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [selectedFolder, setSelectedFolder] = useState<TreeNodeData | null>(null);
  const [testCases, setTestCases] = useState<CaseType[]>([]);
  const [filteredTestCases, setFilteredTestCases] = useState<CaseType[]>([]);
  const [isNameInvalid] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState(false);
  const [exportType, setExportType] = useState(new Set(['xml']));
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
        const tree = buildFolderTree(foldersData);
        setTreeData(tree);
        setSelectedFolder(foldersData[0]);
        initTestCases();
      } catch (error: unknown) {
        logError('Error fetching run data', error);
      }
    }

    fetchDataEffect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenContext]);

  useEffect(() => {
    function onFilter() {
      if (selectedFolder && selectedFolder.id) {
        try {
          const filteredData = testCases.filter((testCase) => testCase.folderId.toString() === selectedFolder.id);
          setFilteredTestCases(filteredData);
        } catch (error: unknown) {
          logError('Error filtering test cases', error);
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

  const handleExportTypeChange = (keys: Selection) => {
    setExportType(new Set(Array.from(keys as Set<string>)));
  };

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
          <ButtonGroup className="me-2">
            <Button
              startContent={<FileDown size={16} />}
              size="sm"
              onPress={() => exportRun(tokenContext.token.access_token, Number(testRun.id), Array.from(exportType)[0])}
            >
              {messages.export} {exportType}
            </Button>
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button isIconOnly size="sm">
                  <ChevronDown size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Export options"
                className="max-w-[300px]"
                selectedKeys={exportType}
                selectionMode="single"
                onSelectionChange={handleExportTypeChange}
              >
                <DropdownItem key="xml" startContent={<FileCode size={16} />}>
                  xml
                </DropdownItem>
                <DropdownItem key="json" startContent={<FileJson size={16} />}>
                  json
                </DropdownItem>
                <DropdownItem key="csv" startContent={<FileSpreadsheet size={16} />}>
                  csv
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </ButtonGroup>
          <Button
            startContent={
              <Badge isInvisible={!isDirty} color="danger" size="sm" content="" shape="circle">
                <Save size={16} />
              </Badge>
            }
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
            <Tree
              data={treeData}
              className="w-full"
              indent={16}
              rowHeight={42}
              overscanCount={5}
              paddingTop={20}
              paddingBottom={20}
              padding={20}
              width="100%"
              openByDefault={false}
              disableDrop={true}
              disableDrag={true}
            >
              {({ node, style }: { node: NodeApi<TreeNodeData>; style: React.CSSProperties }) => (
                <TreeItem
                  style={style}
                  isSelected={selectedFolder ? node.data.id === selectedFolder.id : false}
                  onClick={() => {
                    setSelectedKeys(new Set([]));
                    setSelectedFolder(node.data);
                  }}
                  toggleButton={
                    node.data.children && node.data.children.length > 0 ? (
                      <Button
                        size="sm"
                        className="bg-transparent rounded-full h-6 w-6 min-w-4"
                        isIconOnly
                        onPress={() => node.toggle()}
                      >
                        {node.isOpen ? (
                          <ChevronDown size={20} color="#F7C24E" />
                        ) : (
                          <ChevronRight size={20} color="#F7C24E" />
                        )}
                      </Button>
                    ) : null
                  }
                  icon={<Folder size={20} color="#F7C24E" fill="#F7C24E" />}
                  label={node.data.name}
                />
              )}
            </Tree>
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
