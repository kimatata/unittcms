'use client';
import { useState, useEffect, useContext } from 'react';
import { Button, Card, CardHeader, CardFooter } from '@heroui/react';
import { ArrowRight, Settings } from 'lucide-react';
import { Link, NextUiLinkClasses } from '@/src/i18n/routing';
import { TokenContext } from '@/utils/TokenProvider';
import { fetchMyProjects } from '@/utils/projectsControl';
import { ProjectType } from '@/types/project';
import PublicityChip from '@/components/PublicityChip';
import UserAvatar from '@/components/UserAvatar';
import { LocaleCodeType } from '@/types/locale';
import { logError } from '@/utils/errorHandler';

type AccountPageMessages = {
  yourProjects: string;
  public: string;
  private: string;
  notOwnAnyProjects: string;
  findProjects: string;
  profileSettings: string;
};

type Props = {
  messages: AccountPageMessages;
  locale: LocaleCodeType;
};

export default function AccountPage({ messages, locale }: Props) {
  const context = useContext(TokenContext);
  const [myProjects, setMyProjects] = useState<ProjectType[]>([]);

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }

      try {
        const data = await fetchMyProjects(context.token.access_token);
        setMyProjects(data);
      } catch (error: unknown) {
        logError('Error fetching data:', error);
      }
    }

    fetchDataEffect();
  }, [context]);

  return (
    <>
      {context.isSignedIn() && (
        <div className="container mx-auto max-w-3xl pt-10 px-8 flex-grow">
          <div className="w-full p-3 flex items-center justify-between">
            <Card className="w-[600px] bg-white rounded-2xl shadow-sm border-none">
              <CardHeader className="flex gap-6 justify-between">
                <div className="flex gap-6">
                  <UserAvatar
                    size={48}
                    username={context.token?.user?.username}
                    avatarPath={context.token?.user?.avatarPath}
                  />
                  <div className="flex flex-col">
                    <p className="text-xl font-extrabold text-[#2b2f37]">{context.token?.user?.username}</p>
                    <p className="text-lg text-slate-500">{context.token?.user?.email}</p>
                  </div>
                </div>
                <Button
                  as={Link}
                  href="/account/settings"
                  locale={locale}
                  variant="flat"
                  size="sm"
                  className="bg-indigo-50 text-[#4953ac] font-semibold"
                  startContent={<Settings size={16} />}
                >
                  {messages.profileSettings}
                </Button>
              </CardHeader>
            </Card>
          </div>

          <div className="w-full p-3">
            <h3 className="font-extrabold text-lg text-[#2b2f37] mb-2">{messages.yourProjects}</h3>
            {myProjects.length > 0 ? (
              myProjects.map((myProject, myProjectsIndex) => {
                return (
                  <Card key={myProject.id} className={`w-[600px] bg-white rounded-2xl shadow-sm border-none ${myProjectsIndex !== 0 ? 'mt-2' : ''}`}>
                    <CardHeader className="flex gap-6 pb-0">
                      <Link href={`/projects/${myProject.id}/home`} locale={locale} className={NextUiLinkClasses}>
                        {myProject.name}
                      </Link>
                    </CardHeader>
                    <CardFooter className="justify-between pt-0">
                      <p className="text-small text-slate-500">{myProject.detail}</p>
                      <PublicityChip
                        isPublic={myProject.isPublic}
                        publicText={messages.public}
                        privateText={messages.private}
                      />
                    </CardFooter>
                  </Card>
                );
              })
            ) : (
              <>
                <span className="text-slate-500 me-2">{messages.notOwnAnyProjects}</span>
                <Button
                  as={Link}
                  href={`/projects/`}
                  locale={locale}
                  variant="flat"
                  size="sm"
                  className="bg-indigo-50 text-[#4953ac] font-semibold"
                  endContent={<ArrowRight size={12} />}
                >
                  {messages.findProjects}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
