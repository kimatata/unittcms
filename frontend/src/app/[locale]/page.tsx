import { useTranslations } from 'next-intl';
import { Divider } from '@heroui/react';
import { title, subtitle } from '@/components/primitives';
import PaneMainTitle from './PaneMainTitle';
import PaneMainFeatures from './PaneMainFeatures';
import DemoImage from './DemoImage';
import { PageType } from '@/types/base';
import { LocaleCodeType } from '@/types/locale';

export default function Home({ params }: PageType) {
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
    <section className="mx-auto max-w-screen-xl my-12">
      <div className="flex flex-wrap">
        <div className="w-full md:w-7/12 order-last md:order-first p-4">
          <PaneMainTitle locale={params.locale as LocaleCodeType} />
        </div>

        <div className="w-full md:w-5/12 p-4">
          <div
            style={{
              position: 'relative',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: '10rem',
                position: 'relative',
                zIndex: 1,
              }}
            >
              📋
            </span>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                filter: 'blur(48px)',
                zIndex: 0,
                background: 'linear-gradient(to bottom, #ffecd2, #fcb69f)',
              }}
            ></div>
          </div>
        </div>
      </div>

      <div
        className="flex flex-wrap flex-col items-center"
        style={{
          marginTop: '6rem',
        }}
      >
        <PaneMainFeatures />
      </div>

      <Divider className="my-12" />
      <div className="flex flex-wrap lg:text-left text-center">
        {demoImages.map((demoImage) => (
          <div key={demoImage.uid} className="flex flex-wrap">
            <div className="w-full lg:w-5/12 p-4">
              <h2 className={title({ size: 'sm', color: 'pink' })}>{demoImage.title}</h2>
              <h4 className={subtitle({ class: 'mt-4' })}>{demoImage.subTitle}</h4>
            </div>

            <div className="flex justify-center w-full lg:w-7/12 p-4">
              <DemoImage imageName={demoImage.uid} altText={demoImage.title} />
            </div>
          </div>
        ))}
      </div>

      <Divider className="my-12" />
      <div className="w-full text-center py-2">
        <div>Copyright © 2024-present UnitTCMS</div>
      </div>
    </section>
  );
}
