'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import axiosClient from '@/lib/axiosClient';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import ResponseModal from '@/components/ResponseModal';
import { createResponseAction } from '@/actions/createResponse';

interface Prayer {
  id: string;
  title: string;
  content: string;
  created_at: string;
  deadline: string; // ✅ 이거 추가
  status: string;
  categoryText_en: string;
  categoryText_ko: string;
  intercessions: any[];
  isInProgress: boolean;
  response: {
    content: string;
    is_shared: boolean;
  } | null;
}

export default function MyPrayersPage() {
  const t = useTranslations('MyPrayersPage');
  const locale = useLocale();
  const { data: session, status } = useSession();
  const [myPrayers, setMyPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);

  const statusMap: Record<string, string> = {
    pending: 'pending',
    in_progress: 'inProgress',
    completed: 'completed',
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      axiosClient
        .get('/my-prayers', { params: { userId: session.user.id } })
        .then((res) => {
          setMyPrayers(res.data);
        })
        .catch((err) => {
          console.error('Failed to fetch prayers:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status, session]);

  const handleDelete = async (prayerId: string) => {
    if (!confirm(t('deleteConfirm') || 'Are you sure you want to delete this prayer?')) return;

    try {
      await axiosClient.delete(`/my-prayers`, { params: { id: prayerId } });
      setMyPrayers((prev) => prev.filter((p) => p.id !== prayerId));
    } catch (err) {
      console.error('Failed to delete prayer:', err);
      alert(t('deleteError') || 'Failed to delete.');
    }
  };

  const handleSubmit = async (content: string, isShared: boolean) => {
    if (!selectedPrayer) return;
    try {
      await createResponseAction(selectedPrayer.id, content, isShared);
      // toast.success(t('responseSubmitted'));
      setSelectedPrayer(null);

      // 새로고침 없이 응답 정보 업데이트
      setMyPrayers((prev) =>
        prev.map((p) =>
          p.id === selectedPrayer.id
            ? {
                ...p,
                response: { content, is_shared: isShared },
              }
            : p
        )
      );
    } catch (err) {
      console.error(err);
      // toast.error(t('submissionError'));
    }
  };

  if (loading) return <p className="text-center mt-20 text-gray-500">{t('loading')}</p>;
  if (!session) return <p className="text-center mt-20 text-red-500">{t('pleaseLogin')}</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">{t('myPrayers')}</h1>
        <Link href="/my-prayers/new">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition">
            {t('newPrayer')}
          </button>
        </Link>
      </div>

      {myPrayers.length === 0 ? (
        <p className="text-gray-600 text-center py-10">{t('noPrayers')}</p>
      ) : (
        <ul className="space-y-6">
          {myPrayers.map((prayer) => (
            <li
              key={prayer.id}
              className="border border-gray-300 rounded-lg p-5 bg-white hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">{prayer.title}</h2>
              <span className="text-sm text-gray-500">
                {new Date(prayer.deadline).toLocaleDateString()}
              </span>
              </div>

              <p className="mt-2 text-gray-700 line-clamp-2">{prayer.content}</p>

              <p className="mt-3 text-blue-600 text-sm font-semibold">
              #{locale === 'ko' ? prayer.categoryText_ko : prayer.categoryText_en}
              </p>

              <div className="flex justify-end items-center mt-3 space-x-2 text-sm font-semibold text-gray-700 capitalize">
              {prayer.isInProgress && (
                <span title={t('inProgress')} className="text-yellow-500 text-lg">
                🔥
                </span>
              )}
              <span>
                {t('status')}: {prayer.isInProgress ? t('inProgress') : t(statusMap[prayer.status.toLowerCase()] ?? 'pending')}
              </span>
              </div>

              {/* 응답이 이미 있으면 미리 보여주기 */}
              {prayer.response ? (
              <div className="mt-4 text-sm text-gray-700 border-t pt-4">
                <p className="font-semibold mb-1">{t('yourResponse')}:</p>
                <p className="italic text-gray-600 whitespace-pre-line">{prayer.response.content}</p>

                {/* 🔻 삭제 버튼 추가 */}
                <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleDelete(prayer.id)}
                  className="text-sm bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                >
                  {t('delete')}
                </button>
                </div>
              </div>
              ) : (
              // 응답이 없고, 상태가 completed 아니면 버튼 표시
              prayer.status.toLowerCase() !== 'completed' && (
                <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => setSelectedPrayer(prayer)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                >
                  {t('viewDetails')}
                </button>

                <button
                  onClick={() => handleDelete(prayer.id)}
                  className="text-sm bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                >
                  {t('delete')}
                </button>
                </div>
              )
              )}
            </li>
          ))}
        </ul>
      )}

      {selectedPrayer && (
        <ResponseModal
          prayer={selectedPrayer}
          locale={locale}
          onClose={() => setSelectedPrayer(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
