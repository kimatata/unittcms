'use client';
import { useState, useEffect } from 'react';
import { Button, Tooltip } from '@heroui/react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  ChartColumnStacked,
  ClipboardList,
  FlaskConical,
  UserRound,
  Settings,
} from 'lucide-react';
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

  const [currentKey, setCurrentKey] = useState('home');
  const [isSideBarOpen, setIsSideBarOpen] = useState(true);

  const TOGGLE_ICON_STROKE_WIDTH = 1;
  const TOGGLE_ICON_SIZE = 18;
  const ICON_STROKE_WIDTH = 1;
  const ICON_SIZE = 26;

  const handleClick = (key: string) => {
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
        setCurrentKey('home');
      } else if (currentPath.includes('folders')) {
        setCurrentKey('cases');
      } else if (currentPath.includes('runs')) {
        setCurrentKey('runs');
      } else if (currentPath.includes('members')) {
        setCurrentKey('members');
      } else if (currentPath.includes('settings')) {
        setCurrentKey('settings');
      }
    };

    handleRouteChange(pathname);
  }, [pathname]);

  const tabItems = [
    {
      key: 'home',
      text: messages.home,
      startContent: <ChartColumnStacked strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />,
    },
    {
      key: 'cases',
      text: messages.testCases,
      startContent: <ClipboardList strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />,
    },
    {
      key: 'runs',
      text: messages.testRuns,
      startContent: <FlaskConical strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />,
    },
    {
      key: 'members',
      text: messages.members,
      startContent: <UserRound strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />,
    },
    {
      key: 'settings',
      text: messages.settings,
      startContent: <Settings strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />,
    },
  ];

  return (
    <div className="border-r-1 dark:border-neutral-700">
      <div className="w-full flex justify-end">
        <Tooltip content={messages.toggleSidebar} placement="right">
          <Button size="lg" isIconOnly variant="light" onPress={() => setIsSideBarOpen(!isSideBarOpen)}>
            {isSideBarOpen ? (
              <PanelLeftClose strokeWidth={TOGGLE_ICON_STROKE_WIDTH} size={TOGGLE_ICON_SIZE} />
            ) : (
              <PanelLeftOpen strokeWidth={TOGGLE_ICON_STROKE_WIDTH} size={TOGGLE_ICON_SIZE} />
            )}
          </Button>
        </Tooltip>
      </div>

      <div className="border-t-1 dark:border-neutral-700">
        {tabItems.map((itr) => (
          <div key={itr.key}>
            <Tooltip hidden={isSideBarOpen} content={itr.text} placement="right">
              <Button
                size="lg"
                isIconOnly={!isSideBarOpen}
                startContent={itr.startContent}
                isDisabled={itr.key === currentKey}
                variant="light"
                className={isSideBarOpen ? 'w-full justify-start' : ''}
                onPress={() => handleClick(itr.key)}
              >
                {isSideBarOpen ? itr.text : ''}
              </Button>
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  );
}
