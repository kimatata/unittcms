'use client';
import { useState, useEffect, useContext } from 'react';
import { Link, NextUiLinkClasses } from '@/src/i18n/routing';
import { Button, Card, CardHeader, CardFooter } from '@heroui/react';
import { TokenContext } from '@/utils/TokenProvider';
import Avatar from 'boring-avatars';
import { fetchMyProjects } from '@/utils/projectsControl';
import { ProjectType } from '@/types/project';
import PublicityChip from '@/components/PublicityChip';
import { LocaleCodeType } from '@/types/locale';
import { ArrowRight } from 'lucide-react';

type AccountPageMessages = {
  yourProjects: string;
  public: string;
  private: string;
  notOwnAnyProjects: string;
  findProjects: string;
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
      } catch (error: any) {
        console.error('Error in effect:', error.message);
      }
    }

    fetchDataEffect();
  }, [context]);

  return (
    <>
      {context.isSignedIn() && (
        <div className="container mx-auto max-w-3xl pt-6 px-6 flex-grow">
          <div className="w-full p-3 flex items-center justify-between">
            <Card className="w-[600px]">
              <CardHeader className="flex gap-6">
                <Avatar
                  size={48}
                  name={context.token!.user!.username}
                  variant="beam"
                  colors={['#0A0310', '#49007E', '#FF005B', '#FF7D10', '#FFB238']}
                />
                <div className="flex flex-col">
                  <p className="text-xl font-bold">{context.token!.user!.username}</p>
                  <p className="text-lg text-default-500">{context.token!.user!.email}</p>
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="w-full p-3">
            <h3 className="font-bold mb-2">{messages.yourProjects}</h3>
            {myProjects.length > 0 ? (
              myProjects.map((myProject, myProjectsIndex) => {
                return (
                  <Card key={myProject.id} className={`w-[600px] ${myProjectsIndex !== 0 ? 'mt-2' : ''}`}>
                    <CardHeader className="flex gap-6 pb-0">
                      <Link href={`/projects/${myProject.id}/home`} locale={locale} className={NextUiLinkClasses}>
                        {myProject.name}
                      </Link>
                    </CardHeader>
                    <CardFooter className="justify-between pt-0">
                      <p className="text-small text-default-500">{myProject.detail}</p>
                      <PublicityChip isPublic={true} publicText={messages.public} privateText={messages.private} />
                    </CardFooter>
                  </Card>
                );
              })
            ) : (
              <>
                <span className="text-default-500 me-2">{messages.notOwnAnyProjects}</span>
                <Link href={`/projects/`} locale={locale} className={NextUiLinkClasses}>
                  <Button variant="flat" size="sm" endContent={<ArrowRight size={12} />}>
                    {messages.findProjects}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
