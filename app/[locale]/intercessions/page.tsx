// IntercessionsPage.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Bookmark, Filter, CalendarDays, User } from 'lucide-react';
import axiosClient from '@/lib/axiosClient';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

// 기도 데이터 구조 정의 (백엔드 API 응답과 일치해야 함)
interface Prayer {
  id: string;
  title: string;
  description: string; // 백엔드의 `content` 필드를 `description`으로 매핑
  category: string; // 백엔드의 `category.key`
  dueDate: string; // 백엔드의 `deadline` 필드를 클라이언트에서 사용할 문자열로 포맷팅
  requesterName: string; // 요청자 이름 (익명 처리될 수 있음)
  is_anonymous: boolean | null; // 익명 여부
}

// 카테고리 데이터 구조 정의
interface Category {
  key: string;
  name_en: string;
  name_ko: string;
}

const IntercessionsPage = () => {
  // 다국어 지원 훅
  const t = useTranslations('IntercessionsPage');
  const locale = useLocale();
  // NextAuth.js 세션 훅
  const { data: session, status } = useSession();

  // 상태 관리
  const [prayers, setPrayers] = useState<Prayer[]>([]); // 현재 페이지에 표시될 기도 목록
  const [categories, setCategories] = useState<Category[]>([]); // 카테고리 필터 목록
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // 선택된 카테고리
  const [searchTerm, setSearchTerm] = useState(''); // 검색 입력값
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // 디바운싱된 검색어
  const [sortOrder, setSortOrder] = useState('latest'); // 정렬 순서 ('latest' 또는 'dueDateAsc')
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [message, setMessage] = useState(''); // 사용자에게 표시할 메시지 (성공, 에러 등)
  const prayersPerPage = 10; // 페이지당 기도 개수
  const [totalPrayersCount, setTotalPrayersCount] = useState(0); // API에서 반환하는 전체 기도 개수

  // 현재 로그인한 사용자가 "내 목록에 저장"한 기도들의 ID 목록
  // 이 페이지에서 탐색 중인 기도 목록 중 어떤 것이 이미 저장되었는지 표시하는 데 사용됩니다.
  const [savedPrayerIds, setSavedPrayerIds] = useState<string[]>([]);

  // 검색어 입력 시 디바운싱 적용 (성능 개선)
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 0.5초 대기 후 검색어 업데이트

    return () => clearTimeout(timerId); // 클린업 함수 (이전 타이머 취소)
  }, [searchTerm]);

  // 카테고리 목록을 백엔드에서 가져오는 함수
  const fetchCategories = useCallback(async () => {
    try {
      // API 라우트: `app/api/my-prayers/categories/route.ts` (이 경로가 카테고리를 제공한다고 가정)
      const res = await axiosClient.get('my-prayers/categories');
      const allCategory = {
        key: 'all',
        name_en: t('all_categories'),
        name_ko: t('all_categories'),
      };
      setCategories([allCategory, ...res.data]); // '전체' 카테고리를 목록 맨 앞에 추가
    } catch (e) {
      console.error(e);
      setMessage(t('category_fetch_error_message'));
    }
  }, [t]);

  // 기도 목록을 백엔드에서 가져오는 핵심 함수
  // 이 함수는 검색어, 카테고리, 정렬, 페이지 상태에 따라 데이터를 요청합니다.
  const fetchPrayers = useCallback(async () => {
    setLoading(true); // 로딩 시작
    setMessage(''); // 메시지 초기화
    try {
      // API 쿼리 파라미터 구성
      const queryParams = {
        search: debouncedSearchTerm,
        category: selectedCategory === 'all' ? '' : selectedCategory, // 'all'이면 빈 문자열로 API에 전달하여 모든 카테고리 조회
        sort: sortOrder,
        page: currentPage.toString(),
        limit: prayersPerPage.toString(),
        userId: session?.user?.id ?? undefined, // 로그인된 사용자 ID를 API에 전달하여 해당 사용자의 '저장된 기도' ID 목록을 함께 받기 위함
      };
      // API 라우트: `app/api/intercessions/route.ts` (GET 요청)
      // 이 API는 `prayers` 배열과 `totalCount`, 그리고 `savedPrayerIds`를 반환해야 합니다.
      const res = await axiosClient.get('intercessions', { params: queryParams });

      setPrayers(res.data.prayers || []); // 응답에서 기도 목록 추출
      setSavedPrayerIds(res.data.savedPrayerIds || []); // 응답에서 저장된 기도 ID 목록 추출
      setTotalPrayersCount(res.data.totalCount || 0); // 응답에서 전체 기도 개수 추출
    } catch (e) {
      console.error(e);
      setMessage(t('prayer_list_fetch_error_message')); // 에러 메시지 설정
      setPrayers([]); // 에러 발생 시 목록 초기화
      setSavedPrayerIds([]);
      setTotalPrayersCount(0);
    } finally {
      setLoading(false); // 로딩 종료
    }
  }, [debouncedSearchTerm, selectedCategory, sortOrder, currentPage, prayersPerPage, t, session?.user?.id]);

  // 컴포넌트 마운트 시 카테고리 목록 초기 로드
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 검색어, 카테고리, 정렬, 페이지 변경 시 기도 목록 다시 로드
  // `fetchPrayers` 함수 자체가 모든 필요한 의존성을 포함하고 있으므로, 이펙트의 의존성 배열에 `fetchPrayers`만 넣어도 됩니다.
  useEffect(() => {
    fetchPrayers();
  }, [fetchPrayers]);

  // 총 페이지 수 계산 (memoization으로 성능 최적화)
  const totalPages = useMemo(() => {
    return Math.ceil(totalPrayersCount / prayersPerPage);
  }, [totalPrayersCount, prayersPerPage]);

  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return; // 유효하지 않은 페이지 번호 방지
    setCurrentPage(pageNumber);
  };

  // 기도 저장/삭제 토글 핸들러
  const handleToggleSavePrayer = async (prayerId: string) => {
    // 비로그인 사용자라면 저장/삭제 불가, 메시지 표시
    if (status !== 'authenticated' || !session?.user?.id) {
      setMessage(t('please_login_to_save'));
      setTimeout(() => setMessage(''), 3000); // 3초 후 메시지 사라짐
      return;
    }

    try {
      if (savedPrayerIds.includes(prayerId)) {
        // 이미 저장된 기도이면 삭제 요청 (DELETE /api/intercessions)
        // 백엔드에서는 user_id와 prayer_id를 받아 intercessions 테이블에서 삭제 처리
        const res = await axiosClient.delete(`/intercessions`, { data: { userId: session.user.id, prayerId } });
        if (res.data.success) {
          setMessage(t('prayer_removed_success'));
          setSavedPrayerIds((prev) => prev.filter((id) => id !== prayerId)); // UI에서 즉시 제거
        } else {
          setMessage(res.data.message || t('prayer_remove_failed')); // 백엔드 에러 메시지 표시
        }
      } else {
        // 저장되지 않은 기도이면 저장 요청 (POST /api/intercessions)
        // 백엔드에서는 user_id와 prayer_id를 받아 intercessions 테이블에 추가 처리
        const res = await axiosClient.post('/intercessions', { userId: session.user.id, prayerId });
        if (res.data.success) {
          setMessage(t('prayer_saved_success'));
          setSavedPrayerIds((prev) => [...prev, prayerId]); // UI에 즉시 추가
        } else {
          setMessage(res.data.message || t('prayer_save_failed')); // 백엔드 에러 메시지 표시
        }
      }
    } catch (e) {
      console.error(e);
      setMessage(t('prayer_save_remove_error')); // API 요청 자체 실패 시 에러
    }

    setTimeout(() => setMessage(''), 3000); // 3초 후 메시지 사라짐
  };

  // 로딩 상태 또는 세션 인증 중인 경우 UI
  if (loading || status === 'loading') {
    return <p className="text-center mt-20 text-gray-500">{t('loading_prayers')}</p>;
  }

  // 비인증 상태인 경우 (로그인 필요) UI
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-red-500 text-lg font-semibold mb-4">{t('please_login_to_view')}</p>
          <Link href="/api/auth/signin">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition">
              {t('login_button')}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 font-inter">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center rounded-t-xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{t('page_title')}</h1>
          <p className="mt-2 text-lg opacity-90">{t('page_subtitle')}</p>
        </header>

        <div className="p-4 sm:p-6 space-y-6">
          {/* 검색, 카테고리, 정렬 필터 섹션 */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                className="w-full pl-10 pr-4 py-2 border text-gray-900 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // 검색어 변경 시 첫 페이지로 이동
                }}
              />
            </div>

            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <select
                className="w-full pl-10 pr-4 py-2 border text-gray-900 border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1); // 카테고리 변경 시 첫 페이지로 이동
                }}
              >
                {categories.map((category) => (
                  <option key={category.key} value={category.key}>
                    {locale === 'ko' ? category.name_ko : category.name_en}
                  </option>
                ))}
              </select>
              {/* Lucide-react에 ChevronDown이 없으므로 직접 SVG 추가 (or 다른 라이브러리 사용) */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none lucide lucide-chevron-down">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>

            <button
              onClick={() => {
                setSortOrder(sortOrder === 'dueDateAsc' ? 'latest' : 'dueDateAsc');
                setCurrentPage(1); // 정렬 기준 변경 시 첫 페이지로 이동
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-gray-700"
            >
              <CalendarDays size={20} />
              {sortOrder === 'dueDateAsc' ? t('sort_by_due_date') : t('sort_by_latest')}
            </button>
          </div>

          {/* 메시지 표시 영역 (API 응답 메시지) */}
          {message && (
            <div className="p-3 bg-blue-100 text-blue-800 rounded-md text-center text-sm font-medium animate-fade-in">
              {message}
            </div>
          )}

          {/* 기도 목록 렌더링 */}
          {prayers.length > 0 ? (
            <div className="grid gap-4">
              {prayers.map((prayer) => (
                <div
                  key={prayer.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{prayer.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{prayer.description}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-2 space-x-3">
                      <span className="flex items-center gap-1">
                        <Filter size={14} />{' '}
                        {
                          // prayer.category는 key 값이므로, categories 배열에서 해당 객체를 찾아 name을 표시
                          categories.find((cat) => cat.key === prayer.category)?.[`name_${locale}` as keyof Category]
                          || prayer.category // 그래도 없으면 prayer.category (key) 자체를 표시
                          || t('uncategorized_display_name') // 마지막으로 번역된 '분류되지 않음'을 표시
                        }
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays size={14} /> {t('due_date')}: {prayer.dueDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={14} /> {t('requester')}: {prayer.is_anonymous ? '***' : prayer.requesterName}
                      </span>
                    </div>
                  </div>
                  {/* 저장/삭제 버튼 - savedPrayerIds 배열에 해당 기도가 있는지 여부에 따라 텍스트와 스타일 변경 */}
                  <button
                    onClick={() => handleToggleSavePrayer(prayer.id)}
                    className={`mt-3 sm:mt-0 sm:ml-4 flex items-center gap-2 px-4 py-2 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      savedPrayerIds.includes(prayer.id)
                        ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500' // 이미 저장됨 (제거 버튼)
                        : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500' // 저장 안 됨 (저장 버튼)
                    }`}
                  >
                    <Bookmark size={18} />
                    {savedPrayerIds.includes(prayer.id) ? t('remove_from_my_list') : t('save_to_my_list')}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">{t('no_prayers_found')}</div>
          )}

          {/* 페이지네이션 컨트롤 */}
          {totalPages > 1 && ( // 총 페이지가 1보다 많을 때만 페이지네이션 표시
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <ChevronLeft size={20} />
              </button>
              {/* 페이지 번호 버튼 렌더링 */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-blue-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntercessionsPage;