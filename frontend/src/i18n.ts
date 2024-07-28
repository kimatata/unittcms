import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { LocaleCodeType } from '@/types/locale';

const locales: LocaleCodeType[] = ['en', 'ja'];

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
