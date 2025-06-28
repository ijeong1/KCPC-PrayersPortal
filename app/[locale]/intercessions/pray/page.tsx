// app/[locale]/intercessions/pray/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '기도하기 | Intercede Now',
  description: '지금 기도하기로 선택한 기도제목들을 하나씩 보며 중보하세요.',
};

export default function PrayPage() {
  return (
    <main className="bg-white text-gray-900 max-w-3xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">기도하기</h1>
        <p className="text-sm text-gray-600 mt-1">하나씩 집중해서 기도해보세요.</p>
      </header>

      {/* 카드 형식 (슬라이드처럼 하나만 보여줌) */}
      <section className="border rounded-xl shadow-md p-6 bg-white">
        <div className="mb-4 flex justify-between items-center">
          <span className="text-sm text-blue-600 font-medium">홍길동</span>
          <span className="text-xs text-gray-400">2025.06.28</span>
        </div>

        <h2 className="text-lg font-semibold mb-2">경제적인 어려움 속에서 인도하심을 구합니다</h2>
        <p className="text-sm text-gray-700 mb-4">
          최근에 직장을 잃고 재정적으로 많은 어려움을 겪고 있습니다. 하나님의 공급하심과 평안을 위해 기도 부탁드립니다.
        </p>

        <div className="flex justify-end space-x-2 mt-6">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200">
            다음
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
            기도 완료
          </button>
        </div>
      </section>
    </main>
  );
}
