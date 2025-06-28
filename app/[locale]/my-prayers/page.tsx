'use client';

import { useRouter } from 'next/navigation';

export default function MyPrayersPage() {
  const router = useRouter();

  // 임시로 사용하는 기도 데이터 (나중에 API 연동 가능)
  // 이곳에 구현해주세요
  const myPrayers = [
    {
      id: '1',
      title: '가족의 건강을 위해',
      date: '2025-06-28',
      status: '답변 대기 중',
    },
    {
      id: '2',
      title: '취업 준비 중인 친구를 위해',
      date: '2025-06-25',
      status: '기도 중',
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">내 기도 목록</h1>
        <button
          onClick={() => router.push('/my-prayers/new')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          새 기도 요청
        </button>
      </div>

      {myPrayers.length === 0 ? (
        <p className="text-gray-600">아직 등록된 기도 요청이 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {myPrayers.map((prayer) => (
            <li
              key={prayer.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">{prayer.title}</h2>
                <span className="text-sm text-gray-500">{prayer.date}</span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{prayer.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
