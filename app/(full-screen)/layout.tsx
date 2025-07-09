// app/(full-screen)/layout.tsx
import type { Metadata } from 'next';
import '@/app/globals.css'; // Or '@/globals.css'

export const metadata: Metadata = {
  title: '공유 기도 응답 디스플레이',
  description: '외부 디스플레이용으로 공유된 기도 응답을 보여주는 페이지입니다.',
};

export default function FullScreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Make sure <html> and <body> tags are on the same line
    <html lang="ko"><body>
      {children}
    </body></html> // And here too
  );
}