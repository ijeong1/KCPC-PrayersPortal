'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axiosClient, { setAuthToken } from '@/lib/axiosClient';

// 세션 토큰을 axios에 세팅하는 내부 컴포넌트
function AuthSync() {
  const { data: session } = useSession();

  useEffect(() => {
    setAuthToken(session?.accessToken ?? null);
  }, [session?.accessToken]);

  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthSync /> {/* 세션 동기화 역할만 함 */}
      {children}
    </SessionProvider>
  );
}
