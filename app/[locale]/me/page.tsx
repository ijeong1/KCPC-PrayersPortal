'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { getMyProfile } from '@/actions/getMyProfile';
import ProfileEditModal from '@components/ProfileEditModal';

export default function MePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const t = useTranslations('Me');

  // Move getRoleLabel inside the component
  const getRoleLabel = (role: string | null | undefined) => {
    if (role === 'admin' || role === 'superadmin') return t('roles.admin');
    if (role === 'intercessor') return t('roles.intercessor');
    return t('roles.user'); // null 포함 기본값
  };

  const loadProfile = async () => {
    const data = await getMyProfile();
    setProfile(data.profile);
    setLoggedIn(data.loggedIn);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (loggedIn === false) {
      router.replace('/login');
    }
  }, [loggedIn]);

  if (loggedIn === null) {
    return (
      <main className="flex justify-center items-center h-screen">
        <p className="text-gray-500">{t('messages.loading')}</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex justify-center items-center h-screen">
        <p className="text-gray-500">{t('messages.noProfile')}</p>
      </main>
    );
  }

  return (
    <main className="bg-white text-gray-900 max-w-3xl mx-auto p-6">
      <header className="mb-8 border-b pb-6 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {/* 프로필 사진 */}
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={profile.name || 'Profile Image'}
              className="w-20 h-20 rounded-full object-cover border-2 border-blue-600"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-3xl font-semibold border-2 border-blue-600">
              {profile.name ? profile.name[0].toUpperCase() : '?'}
            </div>
          )}

          {/* 이름, 이메일, 타이틀 */}
          <div>
            <h1 className="text-3xl font-bold">{t('header.title')}</h1>
            <p className="text-gray-600 mt-1">{profile.name || '홍길동'}</p>
            <p className="text-gray-500 text-sm">{profile.email || 'hong@example.com'}</p>
            <p className="text-gray-600 mt-2 text-sm">{t('header.description')}</p>
          </div>
        </div>

        {/* 버튼 */}
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
        >
          {t('actions.edit')}
        </button>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">
          {t('section.title')}
        </h2>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
          <div>
            <dt className="text-sm font-medium text-gray-500">{t('fields.name')}</dt>
            <dd className="text-base font-semibold text-gray-900 mt-1">
              {profile.name || '홍길동'}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">{t('fields.email')}</dt>
            <dd className="text-base font-semibold text-gray-900 mt-1">
              {profile.email || 'hong@example.com'}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">{t('fields.joinedAt')}</dt>
            <dd className="text-base font-semibold text-gray-900 mt-1">
              {profile.created_at ? new Date(profile.created_at).toLocaleDateString('ko-KR') : '2023년 5월 12일'}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">{t('fields.role')}</dt>
            <dd className="text-base font-semibold text-gray-900 mt-1">
              {getRoleLabel(profile.role)} {/* No need to pass 't' now */}
            </dd>
          </div>
        </dl>

        {showModal && (
          <ProfileEditModal
            onSave={async () => {
              await loadProfile();
              setShowModal(false);
            }}
            onClose={() => setShowModal(false)}
          />
        )}
      </section>
    </main>
  );
}