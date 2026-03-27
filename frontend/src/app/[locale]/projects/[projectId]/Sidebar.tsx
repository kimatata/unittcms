'use client';
import { useState, useEffect } from 'react';
import { Tooltip } from '@heroui/react';
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
    <div
      className={
        isSideBarOpen
          ? 'w-56 bg-indigo-950 flex flex-col min-h-[calc(100vh-64px)] transition-all duration-300 shrink-0 shadow-xl shadow-indigo-900/30'
          : 'w-16 bg-indigo-950 flex flex-col min-h-[calc(100vh-64px)] transition-all duration-300 shrink-0 shadow-xl shadow-indigo-900/30'
      }
    >
      <div className="flex justify-end p-2 pt-3">
        <Tooltip content={messages.toggleSidebar} placement="right">
          <button
            className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            onClick={() => setIsSideBarOpen(!isSideBarOpen)}
          >
            {isSideBarOpen ? (
              <PanelLeftClose strokeWidth={TOGGLE_ICON_STROKE_WIDTH} size={TOGGLE_ICON_SIZE} />
            ) : (
              <PanelLeftOpen strokeWidth={TOGGLE_ICON_STROKE_WIDTH} size={TOGGLE_ICON_SIZE} />
            )}
          </button>
        </Tooltip>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2 pt-1">
        {tabItems.map((item) => (
          <Tooltip key={item.key} isDisabled={isSideBarOpen} content={item.text} placement="right">
            <button
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 w-full text-left ${
                currentKey === item.key
                  ? 'text-white bg-gradient-to-r from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/30'
                  : 'text-indigo-200/70 hover:text-white hover:bg-white/10'
              } ${!isSideBarOpen ? 'justify-center' : ''}`}
              onClick={() => handleClick(item.key)}
            >
              <span className="shrink-0">{item.startContent}</span>
              {isSideBarOpen && (
                <span className="font-semibold tracking-wide text-sm">{item.text}</span>
              )}
            </button>
          </Tooltip>
        ))}
      </nav>
    </div>
  );
}
