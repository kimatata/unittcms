'use client';
import { useState, useEffect } from 'react';
import { Listbox, ListboxItem, Button, Tooltip } from '@heroui/react';
import { AlignJustify, Home, Files, FlaskConical, Users, Settings } from 'lucide-react';
import { usePathname, useRouter } from '@/src/i18n/routing';
import useGetCurrentIds from '@/utils/useGetCurrentIds';
import { ProjectMessages } from '@/types/project';

export type Props = {
  messages: ProjectMessages;
  locale: string;
};

export default function Sidebar({ messages, locale }: Props) {
  const { projectId } = useGetCurrentIds();
  const router = useRouter();
  const pathname = usePathname();

  // const [currentKey, setCurrentTab] = useState('home');
  const [isSideBarOpen, setIsSideBarOpen] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState(new Set(['home']));
  // const selectedValue = useMemo(() => Array.from(selectedKeys).join(', '), [selectedKeys]);

  const ICON_STROKE_WIDTH = 2;
  const ICON_SIZE = 16;
  // const baseClass = 'h-12 p-3';
  // const selectedClass = `${baseClass} bg-neutral-200 dark:bg-neutral-700`;

  const handleTabClick = (key: string) => {
    if (key === 'home') {
      router.push(`/projects/${projectId}/home`, { locale: locale });
    } else if (key === 'cases') {
      router.push(`/projects/${projectId}/folders`, { locale: locale });
    } else if (key === 'runs') {
      router.push(`/projects/${projectId}/runs`, { locale: locale });
    } else if (key === 'members') {
      router.push(`/projects/${projectId}/members`, { locale: locale });
    } else if (key === 'settings') {
      router.push(`/projects/${projectId}/settings`, { locale: locale });
    }
  };

  useEffect(() => {
    const handleRouteChange = (currentPath: string) => {
      if (currentPath.includes('home')) {
        setSelectedKeys(new Set(['home']));
      } else if (currentPath.includes('folders')) {
        setSelectedKeys(new Set(['cases']));
      } else if (currentPath.includes('runs')) {
        setSelectedKeys(new Set(['runs']));
      } else if (currentPath.includes('members')) {
        setSelectedKeys(new Set(['members']));
      } else if (currentPath.includes('settings')) {
        setSelectedKeys(new Set(['settings']));
      }
    };

    handleRouteChange(pathname);
  }, [pathname]);

  const tabItems = [
    {
      key: 'home',
      text: messages.home,
      startContent: (
        <Tooltip hidden={isSideBarOpen} content={messages.home} placement="right">
          <Home strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />
        </Tooltip>
      ),
    },
    {
      key: 'cases',
      text: messages.testCases,
      startContent: (
        <Tooltip hidden={isSideBarOpen} content={messages.testCases} placement="right">
          <Files strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />
        </Tooltip>
      ),
    },
    {
      key: 'runs',
      text: messages.testRuns,
      startContent: (
        <Tooltip hidden={isSideBarOpen} content={messages.testRuns} placement="right">
          <FlaskConical strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />
        </Tooltip>
      ),
    },
    {
      key: 'members',
      text: messages.members,
      startContent: (
        <Tooltip hidden={isSideBarOpen} content={messages.members} placement="right">
          <Users strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />
        </Tooltip>
      ),
    },
    {
      key: 'settings',
      text: messages.settings,
      startContent: (
        <Tooltip hidden={isSideBarOpen} content={messages.settings} placement="right">
          <Settings strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="border-r-1 dark:border-neutral-700">
      <Listbox
        disallowEmptySelection
        aria-label="Listbox Variants"
        variant="light"
        selectionMode="single"
        selectedKeys={selectedKeys}
        hideSelectedIcon
        topContent={
          <Button isIconOnly variant="light" onPress={() => setIsSideBarOpen(!isSideBarOpen)}>
            <AlignJustify strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />
          </Button>
        }
        // onSelectionChange={setSelectedKeys}
        // onSelectionChange={() => handleTabClick(itr.key)}
      >
        {tabItems.map((itr) => (
          <ListboxItem
            key={itr.key}
            startContent={itr.startContent}
            onPress={() => handleTabClick(itr.key)}
            className="h-12"
            // color={currentKey === itr.key ? 'primary' : ''}
            // className={currentKey === itr.key ? selectedClass : baseClass}
          >
            {isSideBarOpen ? itr.text : ''}
          </ListboxItem>
        ))}
      </Listbox>

      {/* {tabItems.map((itr) => (
        <Tooltip content={itr.text} placement="right" key={itr.key}>
          <Button
            startContent={itr.startContent}
            onPress={() => handleTabClick(itr.key)}
            className={currentKey === itr.key ? selectedClass : baseClass}
          />
        </Tooltip>
      ))} */}
    </div>
  );
}
