'use client';

import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('HomePage');

  return (
    <div className="text-center mt-12 bg-white text-gray-900">
      <h1 className="text-4xl font-bold mb-4">{t('welcome')}</h1>
      <p className="text-lg">{t('description')}</p>
    </div>
  );
}