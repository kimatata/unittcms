'use client';

import { useContext, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TokenContext } from '@/utils/TokenProvider';
import { LocaleCodeType } from '@/types/locale';
import { useRouter } from '@/src/i18n/routing';

export default function SSOCallbackPage({ params: { locale } }: { params: { locale: LocaleCodeType } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const context = useContext(TokenContext);

  // This needs to be evaluated only once
  useEffect(() => {
    try {
      const tokenParam = searchParams.get('token');

      if (!tokenParam) {
        console.error('No token provided in callback');
        router.replace(`/account/signin`, { locale: locale });
        return;
      }

      const tokenData = JSON.parse(decodeURIComponent(tokenParam));

      context.setToken(tokenData);
      context.storeTokenToLocalStorage(tokenData);

      const userLocale = tokenData.user.locale ?? locale;

      router.replace(`/projects`, { locale: userLocale });
    } catch (error) {
      console.error('Error processing SSO callback:', error);
      router.replace(`/account/signin`, { locale: locale });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <></>;
}
