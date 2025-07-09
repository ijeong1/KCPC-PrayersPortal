// app/[locale]/dashboard/page.tsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prismaClient';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/api/auth/signin'); // fallback 로그인
  }

  const profile = await prisma.profiles.findFirst({
    where: { email: session.user.email },
    select: { role: true },
  });

  const role = profile?.role ?? 'user';

  // 리다이렉션 로직
  if (role === 'admin' || role === 'superadmin') {
    redirect('/admin');
  }

  if (role === 'user') {
    redirect('/my-prayers');
  }

  // intercessor나 기타 role은 이곳에서 계속
  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Welcome, Intercessor 🙏</h1>
      <p className="text-gray-600">여기서 기도 관련 기능들을 구성하면 됩니다.</p>
    </div>
  );
}
