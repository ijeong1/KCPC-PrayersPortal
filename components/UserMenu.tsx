'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function UserMenu() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations('UserMenu');
  const locale = useLocale();

  if (!session?.user) return null;

  const { name, image, email, role } = session.user;
  const userName = name || email || 'User';

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const handleSignOut = () => {
    signOut({ callbackUrl: `/${locale}` });
    setMenuOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none"
      >
        <img
          className="h-8 w-8 rounded-full object-cover"
          src={image || '/default-avatar.png'}
          alt="User"
        />
        <span className="font-medium text-gray-800 hidden md:block">{userName}</span>
        <svg
          className="w-4 h-4 text-gray-600 hidden md:block"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1 text-sm text-gray-700">
            <Link
              href="/me"
              className="block px-4 py-2 hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              {t('profile')}
            </Link>
            <Link
              href="/my-prayers"
              className="block px-4 py-2 hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              {t('myPrayers')}
            </Link>
            {/* intercessor 이상만 보이는 메뉴 */}
            {(role === 'intercessor' || role === 'admin' || role === 'superadmin') && (
              <>
              <Link
                href="/intercessions"
                className="block px-4 py-2 hover:bg-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                {t('intercessions')}
              </Link>
              <Link
                href="/intercessions/pray"
                className="block px-4 py-2 hover:bg-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                {t('pray')}
              </Link>
              </>
            )}
            {(role === 'admin' || role === 'superadmin') && (
              <Link
                href="/admin"
                className="block px-4 py-2 hover:bg-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                {t('admin')}
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              {t('signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
