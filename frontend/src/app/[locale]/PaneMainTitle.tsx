import { Button, Link as NextUiLink } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { title, subtitle } from '@/components/primitives';
import { LocaleCodeType } from '@/types/locale';
import ClientLink from '@/components/ClientLink';

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
        <Button as={ClientLink} href={`/projects/`} locale={locale} color="primary" radius="full" className="px-0">
          {t('demo')}
        </Button>

        <Button
          showAnchorIcon
          as={NextUiLink}
          isExternal
          href="https://kimatata.github.io/unittcms/docs/getstarted/selfhost"
          aria-label="docs"
          color="primary"
          variant="bordered"
          radius="full"
          className="ms-2"
        >
          {t('get_started')}
        </Button>

        <Button
          showAnchorIcon
          as={NextUiLink}
          isExternal
          href="https://github.com/kimatata/unittcms"
          aria-label="Github"
          color="primary"
          variant="bordered"
          radius="full"
          className="ms-2"
        >
          GitHub
        </Button>
      </div>
    </div>
  );
}
