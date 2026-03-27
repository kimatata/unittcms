import { useTranslations } from 'next-intl';
import PaneMainTitle from './PaneMainTitle';
import PaneMainFeatures from './PaneMainFeatures';
import DemoImage from './DemoImage';
import { PageType } from '@/types/base';
import { LocaleCodeType } from '@/types/locale';
import Footer from '@/components/Footer';

export default function LandingPage({ params }: PageType) {
  const t = useTranslations('Index');

  const demoImages = [
    {
      uid: 'project',
      title: t('project_title'),
      subTitle: t('project_subtitle'),
    },
    {
      uid: 'case',
      title: t('case_management_title'),
      subTitle: t('case_management_subtitle'),
    },
    {
      uid: 'run',
      title: t('run_management_title'),
      subTitle: t('run_management_subtitle'),
    },
    {
      uid: 'member',
      title: t('member_management_title'),
      subTitle: t('member_management_subtitle'),
    },
  ];

  return (
    <section className="mx-auto max-w-screen-xl my-12 px-6">
      <div className="flex flex-wrap">
        <div className="w-full md:w-7/12 order-last md:order-first p-4">
          <PaneMainTitle locale={params.locale as LocaleCodeType} />
        </div>

        <div className="w-full md:w-5/12 p-4">
          <div className="relative text-center">
            <span className="text-[10rem] relative z-10">📋</span>
            <div className="absolute inset-0 blur-[48px] z-0 bg-gradient-to-b from-indigo-200 to-violet-200"></div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap flex-col items-center mt-24">
        <PaneMainFeatures />
      </div>

      <div className="my-12" />
      <div className="flex flex-wrap lg:text-left text-center">
        {demoImages.map((demoImage) => (
          <div key={demoImage.uid} className="flex flex-wrap">
            <div className="w-full lg:w-5/12 p-4">
              <h2 className="text-2xl font-extrabold text-[#4953ac] tracking-tight">{demoImage.title}</h2>
              <h4 className="mt-4 text-lg text-slate-500">{demoImage.subTitle}</h4>
            </div>

            <div className="flex justify-center w-full lg:w-7/12 p-4">
              <DemoImage imageName={demoImage.uid} altText={demoImage.title} />
            </div>
          </div>
        ))}
      </div>

      <div className="my-12" />
      <Footer locale={params.locale as LocaleCodeType} />
    </section>
  );
}
