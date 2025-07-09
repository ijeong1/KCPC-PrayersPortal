'use client';

import { signIn, useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';

export default function LoginButton() {
  const { data: session, status } = useSession();
  const t = useTranslations('LoginButton');
  const locale = useLocale();
  
  if (status === 'loading' || session?.user) {
    return null;
  }

  return (
    <button
      onClick={() => signIn('google', { callbackUrl: `/${locale}/dashboard` })}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-semibold shadow"
    >
      {t('login')}
    </button>
  );
}
