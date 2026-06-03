import { useTranslations } from 'next-intl';
import { title, subtitle } from '@/components/primitives';
import { LocaleCodeType } from '@/types/locale';
import { Link } from '@/src/i18n/routing';
import { ExternalLink } from 'lucide-react';

type Props = {
  locale: LocaleCodeType;
};

export default function MainTitle({ locale }: Props) {
  const t = useTranslations('Index');

  return (
    <div className="md:text-left text-center">
      <h1 className={title({ color: 'green', class: 'lg:text-7xl md:text-7xl sm:text-7xl text-7xl' })}>
        UnitTCMS
      </h1>
      <br />
      <br />
      <h1 className={title({ class: 'lg:text-5xl md:text-5xl sm:text-5xl text-5xl' })}>
        {t('oss_tcms')}
      </h1>
      <h4 className={subtitle({ class: 'mt-4' })}>{t('integrate_and_manage')}</h4>

      <div className="mt-5 flex flex-wrap gap-2 md:justify-start justify-center">
        <Link
          href="/projects"
          locale={locale}
          className="inline-flex items-center px-6 h-10 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity no-underline"
        >
          {t('demo')}
        </Link>

        <a
          href="https://kimatata.github.io/unittcms/docs/getstarted/selfhost"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-6 h-10 rounded-full border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors no-underline"
        >
          {t('get_started')}
          <ExternalLink size={14} />
        </a>

        <a
          href="https://github.com/kimatata/unittcms"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-6 h-10 rounded-full border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors no-underline"
        >
          GitHub
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
