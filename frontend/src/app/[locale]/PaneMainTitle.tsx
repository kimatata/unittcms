import { title, subtitle } from '@/components/primitives';
import { Button, Link as NextUiLink } from '@nextui-org/react';
import { MoveUpRight } from 'lucide-react';
import { Link } from '@/src/navigation';
import { useTranslations } from 'next-intl';

type Props = {
  locale: string;
};

export default function MainTitle({ locale }: Props) {
  const t = useTranslations('Index');

  return (
    <div className="md:text-left text-center">
      <h1
        className={title({
          color: 'green',
          class: 'lg:text-7xl md:text-7xl sm:text-7xl text-7xl',
        })}
      >
        LandTCMS
      </h1>
      <br />
      <br />
      <h1
        className={title({
          class: 'lg:text-5xl md:text-5xl sm:text-5xl text-5xl',
        })}
      >
        {t('oss_tcmt')}
        <br />
        {t('web_application')}
      </h1>
      <h4 className={subtitle({ class: 'mt-4' })}>{t('integrate_and_manage')}</h4>

      <div className="mt-5">
        <Link href={`/projects/`} locale={locale}>
          <Button color="primary" radius="full" className="px-0">
            {t('demo')}
          </Button>
        </Link>

        <NextUiLink isExternal href="https://kimatata.github.io/landtcms/docs/getstarted/selfhost" aria-label="docs">
          <Button
            color="primary"
            variant="bordered"
            radius="full"
            className="ms-2"
            endContent={<MoveUpRight size={12} />}
          >
            {t('get_started')}
          </Button>
        </NextUiLink>

        <NextUiLink size="sm" isExternal href="https://github.com/kimatata/landtcms" aria-label="Github">
          <Button
            color="primary"
            variant="bordered"
            radius="full"
            className="ms-2"
            endContent={<MoveUpRight size={12} />}
          >
            GitHub
          </Button>
        </NextUiLink>
      </div>
    </div>
  );
}