import { title, subtitle } from '@/components/primitives';
import { Button, Link as NextUiLink } from '@heroui/react';
import { MoveUpRight } from 'lucide-react';
import { Link } from '@/src/i18n/routing';
import { useTranslations } from 'next-intl';
import { LocaleCodeType } from '@/types/locale';

type Props = {
  locale: LocaleCodeType;
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
        UnitTCMS
      </h1>
      <br />
      <br />
      <h1
        className={title({
          class: 'lg:text-5xl md:text-5xl sm:text-5xl text-5xl',
        })}
      >
        {t('oss_tcms')}
      </h1>
      <h4 className={subtitle({ class: 'mt-4' })}>{t('integrate_and_manage')}</h4>

      <div className="mt-5">
        <Link href={`/projects/`} locale={locale}>
          <Button color="primary" radius="full" className="px-0">
            {t('demo')}
          </Button>
        </Link>

        <NextUiLink isExternal href="https://kimatata.github.io/unittcms/docs/getstarted/selfhost" aria-label="docs">
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

        <NextUiLink size="sm" isExternal href="https://github.com/kimatata/unittcms" aria-label="Github">
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
