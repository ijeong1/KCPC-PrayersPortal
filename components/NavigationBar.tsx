'use client';

import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import AuthSection from './AuthSection';

export default function NavigationBar() {
  const t = useTranslations('NavigationBar');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const nextLocale = locale === 'ko' ? 'en' : 'ko';

  const handleLocaleToggle = () => {
    router.push(pathname, { locale: nextLocale });
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* 왼쪽: 로고 */}
        <div className="flex items-center space-x-2 mr-auto">
          <div className="w-10 h-10 flex items-center justify-center text-white text-2xl font-bold">
            🙏
          </div>
          <Link href="/" className="text-2xl font-bold text-gray-900 tracking-tight">
            KCPC Prayers Portal
          </Link>
        </div>

        {/* 중앙: 검색창 */}
        {/* <div className="flex-grow max-w-md mx-4">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div> */}

        {/* 유저 메뉴 */}
        <div className="flex items-center justify-end flex-1">
          <AuthSection />
        </div>

        {/* 언어 토글 */}
        {/* <div className="flex items-center space-x-4">
          <button
            onClick={handleLocaleToggle}
            className="px-3 py-1 border border-gray-400 rounded-md text-gray-900 hover:bg-gray-100 transition"
          >
            {nextLocale.toUpperCase()}
          </button>
        </div> */}
        
      </div>
    </nav>
  );
}
