'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';

export default function Footer() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Footer');

  const nextLocale = locale === 'ko' ? 'en' : 'ko';

  const handleLocaleToggle = () => {
    router.push(pathname, { locale: nextLocale });
  };

  return (
    <footer className="bg-gray-100 text-gray-600 text-sm py-4 mt-auto border-t">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <p>&copy; 2025 KCPC PrayerLink</p>
        <button
          onClick={handleLocaleToggle}
          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-200 transition"
        >
          {nextLocale.toUpperCase()}
        </button>
      </div>
    </footer>
  );
}
