'use client';

import { useContext, useLayoutEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TokenContext } from '@/utils/TokenProvider';

export default function SSOCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const context = useContext(TokenContext);

  useLayoutEffect(() => {
    try {
      const tokenParam = searchParams.get('token');

      if (!tokenParam) {
        console.error('No token provided in callback');
        router.replace('/account/signin');
        return;
      }

      const tokenData = JSON.parse(decodeURIComponent(tokenParam));

      context.setToken(tokenData);
      context.storeTokenToLocalStorage(tokenData);

      router.replace('/projects');
    } catch (error) {
      console.error('Error processing SSO callback:', error);
      router.replace('/account/signin');
    }
  }, [context, router, searchParams]);

  return <></>;
}
