import { redirect } from 'next/navigation';
import { PageType } from '@/types/base';
import Config from '@/config/config';
import LandingPage from '@/src/app/[locale]/LandingPage';

export default function Home({ params }: PageType) {
  if (!Config.isDemoSite) {
    redirect(`/${params.locale}/projects`);
  }

  return <LandingPage params={params} />;
}
