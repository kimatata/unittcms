import '@/styles/globals.css';
import { fontSans } from '@/config/fonts';
import { Providers } from './providers';
import Header from './Header';
import clsx from 'clsx';
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';

export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslations({ locale, namespace: 'Header' });
  return {
    title: t('title'),
    description: t('description'),
    icons: {
      icon: '/favicon/favicon.ico',
      shortcut: '/favicon/favicon-16x16.png',
      apple: '/favicon/apple-touch-icon.png',
    },
  };
}

export default function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const t = useTranslations('Toast');
  const toastMessages = {
    needSignedIn: t('need_signed_in'),
    sessionExpired: t('session_expired'),
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head />
      <body className={clsx('min-h-[calc(100vh-64px)] bg-background font-sans antialiased', fontSans.variable)}>
        <Providers
          themeProps={{ attribute: 'class', defaultTheme: 'light' }}
          tokenProps={{ toastMessages: toastMessages, locale: locale }}
        >
          <div className="relative flex flex-col min-h-screen light:bg-neutral-50 dark:bg-neutral-800">
            <Header locale={locale} />
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
