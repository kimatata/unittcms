import { LocaleCodeType } from '@/types/locale';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: LocaleCodeType } }) {
  const t = await getTranslations({ locale, namespace: 'Auth' });
  return {
    title: `${t('account')} | UnitTCMS`,
    robots: { index: false, follow: false },
  };
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="w-full flex items-center justify-center">{children}</div>
    </>
  );
}
