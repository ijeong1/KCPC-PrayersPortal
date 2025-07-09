// app/intercessions/pray/page.tsx
'use client'; // 클라이언트 컴포넌트임을 명시

import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '@/lib/axiosClient'; // axiosClient 유틸리티 임포트
import { useSession } from 'next-auth/react'; // NextAuth.js 세션 훅 임포트
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'; // 아이콘 임포트 (lucide-react 필요)
import { useRouter } from 'next/navigation'; // Next.js 라우터 훅 임포트

// 기도 아이템의 타입을 정의합니다. (백엔드에서 오는 데이터 구조와 일치해야 합니다)
interface PrayerItem {
  id: string;
  title: string;
  content: string;
  dueDate: string; // "YYYY. MM. DD" 또는 "마감일 없음" 같은 포맷
  requesterName: string;
  is_anonymous: boolean | null; // 스키마에 따라 null 가능성 반영
  category: string; // 카테고리 이름 또는 'Uncategorized'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED'; // PrayerStatus enum 값
  // Prisma로부터 오는 Date 타입이 string으로 변환되어 올 수도 있으므로,
  // 필요에 따라 'deadline: Date | null;' 등을 여기에 추가할 수 있습니다.
  // 하지만 dueDate로 이미 포맷팅된 문자열을 받으므로 충분합니다.
}

const PrayPage: React.FC = () => {
  const { data: session, status } = useSession(); // 세션 데이터와 상태 가져오기
  const router = useRouter(); // 라우터 훅 초기화

  const [prayers, setPrayers] = useState<PrayerItem[]>([]); // 기도 목록 상태
  const [currentIndex, setCurrentIndex] = useState(0); // 현재 보고 있는 기도의 인덱스
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState<string | null>(null); // 에러 메시지 상태

  // 1. 기도 목록을 백엔드에서 가져오는 함수
  const fetchPrayers = useCallback(async () => {
    // 세션이 로딩 중이거나 인증되지 않았다면 API 호출하지 않음
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !session?.user?.id) {
      setLoading(false);
      // 로그인되지 않았다면 로그인 페이지로 리디렉트
      router.push('/api/auth/signin');
      return;
    }

    setLoading(true); // 로딩 시작
    setError(null); // 이전 에러 초기화
    try {
      // GET 요청을 통해 사용자의 중보기도 대상 목록을 가져옵니다.
      const response = await axiosClient.get<PrayerItem[]>('/intercessions/pray');
      const fetchedPrayers = response.data;

      setPrayers(fetchedPrayers);

      // 초기 인덱스 설정: PENDING 상태의 기도가 있다면 가장 첫 번째 PENDING 기도로,
      // 없다면 목록의 첫 번째 기도로 설정합니다.
      const initialIndex = fetchedPrayers.findIndex((p: PrayerItem) => p.status === 'PENDING');
      setCurrentIndex(initialIndex !== -1 ? initialIndex : 0);

    } catch (err) {
      console.error('Failed to fetch prayers:', err);
      setError('기도 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false); // 로딩 종료
    }
  }, [session?.user?.id, status, router]);

  // 2. 기도의 상태를 업데이트하는 함수 (IN_PROGRESS 또는 COMPLETED)
  const updatePrayerStatus = useCallback(async (prayerId: string, newStatus: 'IN_PROGRESS' | 'COMPLETED') => {
    if (status !== 'authenticated' || !session?.user?.id) return; // 인증되지 않았다면 함수 실행 중단

    try {
      // PATCH 요청을 통해 기도의 상태를 업데이트합니다.
      await axiosClient.patch('/intercessions/pray', { prayerId, status: newStatus });

      // UI에서도 해당 기도의 상태를 즉시 업데이트하여 반영합니다.
      setPrayers(prevPrayers =>
        prevPrayers.map(p => (p.id === prayerId ? { ...p, status: newStatus } : p))
      );
    } catch (err) {
      console.error(`Failed to update prayer status to ${newStatus}:`, err);
      // 사용자에게 에러 메시지를 보여줄 필요가 있다면 setError 호출
      // setError(`기도 상태 업데이트 실패: ${newStatus}`);
    }
  }, [session?.user?.id, status]);

  // 3. 페이지 로드 시 및 세션 상태 변경 시 기도 목록을 가져옵니다.
  useEffect(() => {
    fetchPrayers();
  }, [fetchPrayers]);

  // 4. 현재 기도가 변경될 때마다 해당 기도의 상태를 IN_PROGRESS로 업데이트합니다.
  // 단, 이미 COMPLETED 상태인 기도는 업데이트하지 않습니다.
  useEffect(() => {
    if (prayers.length > 0 && prayers[currentIndex]) {
      const currentPrayer = prayers[currentIndex];
      // PENDING 상태인 경우에만 IN_PROGRESS로 업데이트
      if (currentPrayer.status === 'PENDING') {
        updatePrayerStatus(currentPrayer.id, 'IN_PROGRESS');
      }
    }
  }, [currentIndex, prayers, updatePrayerStatus]);

  // 5. "이전 기도" 버튼 핸들러
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // 6. "다음 기도" 버튼 핸들러
  const handleNext = () => {
    if (currentIndex < prayers.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // 모든 기도를 다 봤을 때
      alert("모든 기도를 다 확인했습니다. 수고하셨습니다!");
      router.push('/intercessions'); // 예를 들어, 중보기도 목록 페이지로 리디렉트
    }
  };

  // 7. "이 기도 완료하기" 버튼 핸들러
  const handleCompletePrayer = async () => {
    if (prayers.length > 0 && prayers[currentIndex]) {
      await updatePrayerStatus(prayers[currentIndex].id, 'COMPLETED');
      handleNext(); // 완료 후 다음 기도로 이동
    }
  };

  // 8. 로딩 상태 UI
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <p className="ml-4 text-lg text-gray-700 mt-4">기도 목록을 불러오는 중...</p>
      </div>
    );
  }

  // 9. 에러 상태 UI
  if (error) {
    return <div className="text-center text-red-500 mt-20">{error}</div>;
  }

  // 10. 기도 목록이 없는 경우 UI
  if (prayers.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">현재 중보기도할 기도가 없습니다.</h2>
          <p className="text-gray-600">새로운 기도를 찾아보거나, 잠시 후에 다시 방문해주세요.</p>
          <button
            onClick={() => router.push('/intercessions')}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            기도 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 11. 현재 표시할 기도 아이템
  const currentPrayer = prayers[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl transform transition-all duration-300 ease-in-out">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4 text-center">
          {currentPrayer.title}
        </h2>
        <p className="text-gray-700 leading-relaxed text-base sm:text-lg mb-6 whitespace-pre-wrap">
          {currentPrayer.content}
        </p>

        <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
          <span className="flex items-center gap-1">
            <span className="font-semibold">카테고리:</span> {currentPrayer.category}
          </span>
          <span className="flex items-center gap-1">
            <span className="font-semibold">마감일:</span> {currentPrayer.dueDate}
          </span>
        </div>
        <div className="text-sm text-gray-600 text-center mb-6">
          <span className="font-semibold">요청자:</span>{' '}
          {currentPrayer.is_anonymous ? '익명' : currentPrayer.requesterName}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0} // 첫 번째 기도에서는 '이전' 버튼 비활성화
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} /> 이전 기도
          </button>
          <button
            onClick={handleNext}
            disabled={prayers.length === 0} // 기도 목록이 없으면 비활성화
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            다음 기도 <ChevronRight size={20} />
          </button>
        </div>

        {/* '이 기도 완료하기' 버튼 */}
        <div className="mt-4 text-center">
          <button
            onClick={handleCompletePrayer}
            disabled={prayers.length === 0} // 기도 목록이 없으면 비활성화
            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            이 기도 완료하기
          </button>
        </div>
      </div>
      {/* 현재 기도 인덱스와 총 기도 수 표시 */}
      <div className="mt-4 text-gray-600">
        {prayers.length > 0 ? `${currentIndex + 1} / ${prayers.length}` : '0 / 0'}
      </div>
    </div>
  );
};

export default PrayPage;