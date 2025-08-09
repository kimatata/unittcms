'use client';
import { useState, useEffect } from 'react';
import { Listbox, ListboxItem } from '@heroui/react';
import { Home, Files, FlaskConical, Users, Settings } from 'lucide-react';
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

  const [currentKey, setCurrentTab] = useState('home');

  const ICON_STROKE_WIDTH = 2;
  const ICON_SIZE = 16;
  const baseClass = 'h-18 flex flex-col p-3 text-gray-500 border-l-2 rounded-none border-transparent';
  const selectedClass = `${baseClass} bg-neutral-200 dark:bg-neutral-700 !text-primary border-primary`;

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
        setCurrentTab('home');
      } else if (currentPath.includes('folders')) {
        setCurrentTab('cases');
      } else if (currentPath.includes('runs')) {
        setCurrentTab('runs');
      } else if (currentPath.includes('members')) {
        setCurrentTab('members');
      } else if (currentPath.includes('settings')) {
        setCurrentTab('settings');
      }
    };

    handleRouteChange(pathname);
  }, [pathname]);

  const tabItems = [
    {
      key: 'home',
      text: messages.home,
      startContent: <Home strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />,
    },
    {
      key: 'cases',
      text: messages.testCases,
      startContent: <Files strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />,
    },
    {
      key: 'runs',
      text: messages.testRuns,
      startContent: <FlaskConical strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />,
    },
    {
      key: 'members',
      text: messages.members,
      startContent: <Users strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />,
    },
    {
      key: 'settings',
      text: messages.settings,
      startContent: <Settings strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />,
    },
  ];

  return (
    <div className="w-18 border-r-1 dark:border-neutral-700">
      <Listbox aria-label="Listbox Variants" variant="light" className="p-0">
        {tabItems.map((itr) => (
          <ListboxItem
            key={itr.key}
            startContent={itr.startContent}
            onPress={() => handleTabClick(itr.key)}
            className={currentKey === itr.key ? selectedClass : baseClass}
          >
            {itr.text}
          </ListboxItem>
        ))}
      </Listbox>
    </div>
  );
}
