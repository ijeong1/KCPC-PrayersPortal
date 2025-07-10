import type { Metadata } from 'next';
import '@/app/globals.css';
import Providers from '@/components/Providers';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  title: '공유 기도 응답 디스플레이',
  description: '외부 디스플레이용으로 공유된 기도 응답을 보여주는 페이지입니다.',
};

export default function FullScreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
}