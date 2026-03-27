import { Button, Link as NextUiLink } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { LocaleCodeType } from '@/types/locale';
import ClientLink from '@/components/ClientLink';

type Props = {
  locale: LocaleCodeType;
};

export default function MainTitle({ locale }: Props) {
  const t = useTranslations('Index');

  return (
    <div className="md:text-left text-center">
      <h1 className="lg:text-7xl md:text-7xl sm:text-7xl text-7xl font-extrabold bg-gradient-to-r from-[#4953ac] to-[#652fe7] bg-clip-text text-transparent tracking-tight">
        UnitTCMS
      </h1>
      <br />
      <br />
      <h1 className="lg:text-5xl md:text-5xl sm:text-5xl text-5xl font-extrabold text-[#2b2f37] tracking-tight">
        {t('oss_tcms')}
      </h1>
      <h4 className="mt-4 text-lg text-slate-500">{t('integrate_and_manage')}</h4>

      <div className="mt-5">
        <Button as={ClientLink} href={`/projects/`} locale={locale} radius="full" className="bg-gradient-to-r from-[#4953ac] to-[#652fe7] text-white font-bold shadow-lg shadow-indigo-500/20 px-6">
          {t('demo')}
        </Button>

        <Button
          showAnchorIcon
          as={NextUiLink}
          isExternal
          href="https://kimatata.github.io/unittcms/docs/getstarted/selfhost"
          aria-label="docs"
          variant="bordered"
          radius="full"
          className="ms-2 border-[#4953ac] text-[#4953ac] font-semibold"
        >
          {t('get_started')}
        </Button>

        <Button
          showAnchorIcon
          as={NextUiLink}
          isExternal
          href="https://github.com/kimatata/unittcms"
          aria-label="Github"
          variant="bordered"
          radius="full"
          className="ms-2 border-[#4953ac] text-[#4953ac] font-semibold"
        >
          GitHub
        </Button>
      </div>
    </div>
  );
}
