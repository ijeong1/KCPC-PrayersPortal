import { useTranslations } from 'next-intl';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile',
  description: 'Multi-language profile view page',
};

export default function MePage() {
  const t = useTranslations('Me');

  return (
    <main className="bg-white text-gray-900 max-w-3xl mx-auto p-6">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-gray-600 mt-2 text-sm">{t('description')}</p>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">{t('title')}</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
          <div>
            <dt className="text-sm font-medium text-gray-500">{t('name')}</dt>
            <dd className="text-base font-semibold text-gray-900 mt-1">홍길동</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">{t('email')}</dt>
            <dd className="text-base font-semibold text-gray-900 mt-1">hong@example.com</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">{t('joinedAt')}</dt>
            <dd className="text-base font-semibold text-gray-900 mt-1">2023년 5월 12일</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">{t('role')}</dt>
            <dd className="text-base font-semibold text-gray-900 mt-1">일반 사용자</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
