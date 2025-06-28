// app/[locale]/intercessions/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '중보기도 요청 모음 | Intercessions Feed',
  description: '모든 중보기도 요청을 카드 형태로 확인할 수 있습니다.',
};

export default function IntercessionsPage() {
  return (
    <main className="bg-white text-gray-900 max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">중보기도 요청</h1>
        <p className="text-gray-600 mt-2 text-sm">다른 성도들의 기도 제목을 함께 나누고, 중보하세요.</p>
      </header>

      {/* Search and Filter */}
      <section className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <input
          type="text"
          placeholder="기도 제목 검색..."
          className="w-full sm:w-1/2 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <select
          className="w-full sm:w-40 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700"
          defaultValue=""
        >
          <option value="" disabled>
            필터 선택
          </option>
          <option value="all">전체</option>
          <option value="answered">응답됨</option>
          <option value="urgent">긴급</option>
          <option value="mine">내가 쓴 글</option>
        </select>
      </section>

      {/* Cards Feed */}
      <section className="space-y-6">
        {Array.from({ length: 3 }).map((_, idx) => (
          <article
            key={idx}
            className="border border-gray-200 rounded-xl shadow-sm p-5 transition hover:shadow-md bg-white"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-blue-600 font-medium">홍길동</span>
              <span className="text-xs text-gray-400">2025.06.28</span>
            </div>
            <h2 className="text-lg font-semibold mb-2">가족의 건강을 위해 기도해주세요</h2>
            <p className="text-sm text-gray-700 line-clamp-3">
              최근 저희 가족에게 건강에 관한 큰 어려움이 닥쳤습니다. 병원 검사 결과가 나오기까지 기다리는 시간이 너무 힘듭니다...
            </p>
            <div className="mt-4 flex gap-2 text-xs text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded-full">#건강</span>
              <span className="bg-gray-100 px-2 py-1 rounded-full">#가족</span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
