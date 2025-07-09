// app/[locale]/login/page.tsx

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prismaClient';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    const profile = await prisma.profiles.findFirst({
      where: { email: session.user.email },
      select: { role: true },
    });

    const role = profile?.role || 'user';

    if (role === 'admin' || role === 'superadmin') {
      redirect('/admin');
    } else if (role === 'intercessor') {
      redirect('/dashboard');
    } else {
      redirect('/');
    }
  }

  // 로그인 UI
  return (
    <main className="flex justify-center items-center h-screen">
      {/* Google 로그인 버튼 */}
    </main>
  );
}
