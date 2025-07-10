'use client';

import { useSession } from 'next-auth/react';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, easeIn, easeOut } from 'framer-motion';
import { SharedResponsePayload } from '@/services/responseService';
import axiosClient from '@/lib/axiosClient';

// 요청자 이름 마스킹 함수
const maskRequesterName = (name: string | null | undefined): string => {
  if (!name) return '익명';
  if (name.length <= 1) return name + '***';
  return name.charAt(0) + '***';
};

const DISPLAY_COUNT = 3;
const INTERVAL_TIME = 8000;

export default function AdminResponseDisplayPage() {
  const { data: session, status } = useSession();
  const [allResponses, setAllResponses] = useState<SharedResponsePayload[]>([]);
  const [displayedResponses, setDisplayedResponses] = useState<SharedResponsePayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentIndex = useRef(0);

  useEffect(() => {
    console.log('Session:', session);
    console.log('Status:', status);
    if (session?.accessToken) {
      console.log('AccessToken:', session.accessToken);
    } else {
      console.log('No accessToken in session');
    }
  }, [session, status]);

  // API에서 공유된 응답 가져오기
  useEffect(() => {
    const fetchResponses = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get<SharedResponsePayload[]>('/responses');
        setAllResponses(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || '공유된 응답을 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, []);

  const updateDisplayedResponses = useCallback(() => {
    if (allResponses.length === 0) {
      setDisplayedResponses([]);
      return;
    }

    if (allResponses.length <= DISPLAY_COUNT) {
      setDisplayedResponses(allResponses);
      return;
    }

    const endIndex = currentIndex.current + DISPLAY_COUNT;
    let newDisplayed = [];

    if (endIndex <= allResponses.length) {
      newDisplayed = allResponses.slice(currentIndex.current, endIndex);
    } else {
      newDisplayed = allResponses.slice(currentIndex.current, allResponses.length);
      newDisplayed = newDisplayed.concat(allResponses.slice(0, endIndex - allResponses.length));
    }

    setDisplayedResponses(newDisplayed);
    currentIndex.current = (currentIndex.current + 1) % allResponses.length;
  }, [allResponses]);

  useEffect(() => {
    if (allResponses.length > 0) {
      updateDisplayedResponses();

      const interval = setInterval(() => {
        updateDisplayedResponses();
      }, INTERVAL_TIME);

      return () => clearInterval(interval);
    }
  }, [allResponses, updateDisplayedResponses]);

  const cardVariants = {
    initial: { opacity: 0, y: 50, rotateX: -90 },
    animate: { 
      opacity: 1, 
      y: 0, 
      rotateX: 0, 
      transition: { duration: 0.8, ease: easeOut } 
    },
    exit: { 
      opacity: 0, 
      y: -50, 
      rotateX: 90, 
      transition: { duration: 0.6, ease: easeIn } 
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl">
        ✨ 기도 응답을 불러오는 중입니다...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-red-800 text-white text-2xl">
        ⚠️ 오류 발생: {error}
      </div>
    );
  }

  if (allResponses.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl">
        아직 공유된 기도 응답이 없습니다. 💌
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden">
      <h1 className="text-5xl font-extrabold text-white mb-12 drop-shadow-lg text-center tracking-wide">
        ✨ 은혜로운 기도 응답들 ✨
      </h1>

      <div className="relative w-full max-w-6xl h-[60vh] flex justify-center items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={displayedResponses[0]?.id || 'no-responses'}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full h-full justify-items-center items-center"
          >
            {displayedResponses.map((response, idx) => (
              <motion.div
                key={response.id}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ delay: idx * 0.2, duration: 0.8, ease: 'easeOut' }}
                className="relative bg-white rounded-2xl shadow-2xl p-8 flex flex-col justify-between transform perspective-[1000px] hover:shadow-3xl transition-all duration-300 w-full h-full max-w-sm"
                style={{ minHeight: '300px' }}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/background-pattern.png')"}}></div>
                <div className="relative z-10 flex flex-col flex-grow">
                  <p className="text-gray-800 text-2xl font-bold mb-4 leading-tight">
                    "{response.content}"
                  </p>

                  <h2 className="text-xl font-semibold text-indigo-700 mt-auto mb-2 line-clamp-2">
                    <span className="font-normal text-gray-500">기도: </span>
                    {response.prayers?.title ?? '제목 없음'}
                  </h2>
                </div>

                <div className="relative z-10 border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center justify-between text-gray-600 text-sm mb-1">
                    <span className="font-medium text-gray-700">카테고리:</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                      {response.prayers?.category?.name_ko ?? response.prayers?.category?.name_en ?? 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600 text-sm">
                    <span className="font-medium text-gray-700">요청자:</span>
                    <span className="text-indigo-500 font-bold">{maskRequesterName(response.prayers?.requestedBy?.name)}</span>
                  </div>
                  <div className="text-right text-xs text-gray-400 mt-3">
                    응답일: {new Date(response.created_at || '').toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-white text-lg mt-12 drop-shadow-md">
        "하나님께서는 우리의 기도를 들으시고 응답하십니다."
      </p>
    </div>
  );
}
