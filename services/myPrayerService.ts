import { PrismaClient, Prisma, PrayerStatus } from '@prisma/client';

const prisma = new PrismaClient();

// First, perform the query to allow TypeScript to infer its return type.
// We'll then use ReturnType to extract that inferred type.
// This is a temporary dummy call, its sole purpose is type inference.
const _prayerQuery = prisma.prayers.findMany({
  include: {
    category: true,
    intercessions: true,
    responses: {
      where: { responder_id: 'dummy' }, // Use a dummy value for type inference
      take: 1,
      select: {
        content: true,
        is_shared: true,
      },
    },
  },
});

// Now, extract the exact type of a single prayer object from the inferred array type.
type PrayerWithRelations = Awaited<typeof _prayerQuery>[number];

// Define the final shape of each item your function will return.
type MyPrayerItem = PrayerWithRelations & {
  categoryText_en: string;
  categoryText_ko: string;
  isInProgress: boolean;
  response: { content: string; is_shared: boolean } | null;
};

export async function getMyPrayers(userId: string): Promise<MyPrayerItem[]> {
  const prayers = await prisma.prayers.findMany({
    where: { requested_by: userId },
    orderBy: { created_at: 'desc' },
    include: {
      category: true,
      intercessions: true,
      responses: {
        where: { responder_id: userId },
        take: 1,
        select: {
          content: true,
          is_shared: true,
        },
      },
    },
  });

  // Explicitly type 'prayer' as PrayerWithRelations
  return prayers.map((prayer: PrayerWithRelations) => ({
    ...prayer,
    categoryText_en: prayer.category?.name_en ?? prayer.category?.key ?? '',
    categoryText_ko: prayer.category?.name_ko ?? prayer.category?.key ?? '',
    isInProgress: Array.isArray(prayer.intercessions) && prayer.intercessions.length > 0,
    response: prayer.responses && prayer.responses.length > 0 ? prayer.responses[0] : null,
  }));
}

interface CreatePrayerData {
  title: string;
  content: string;
  deadline?: string | null; // Optional deadline
  isAnonymous?: boolean; // Optional anonymous status
  requestedBy: string; // ID of the requester
  categoryId: string; // ✨ 변경: 이제 카테고리 ID는 필수 문자열입니다.
}

/**
 * 새로운 기도 요청을 생성합니다.
 * @param data 기도 요청 생성에 필요한 데이터 (제목, 내용, 마감일, 익명 여부, 요청자 ID, 카테고리 ID)
 * @returns 생성된 기도 요청 객체
 */
export async function createPrayer(data: CreatePrayerData) {
  const { title, content, deadline, isAnonymous, requestedBy, categoryId } = data;

  const prayer = await prisma.prayers.create({
    data: {
      title,
      content,
      requested_by: requestedBy,
      deadline: deadline ? new Date(deadline) : null, // 마감일이 있으면 Date 객체로 변환
      is_anonymous: !!isAnonymous, // boolean 값으로 명확히 변환
      category_id: categoryId,
      // ✨ 변경: 'pending' 문자열 대신 PrayerStatus.PENDING 사용
      status: PrayerStatus.PENDING, // 이제 enum 멤버를 할당합니다.
      updated_at: new Date(), // 업데이트 시간은 현재 시간으로 설정
    },
  });
  return prayer;
}

/**
 * 모든 기도 카테고리를 가져옵니다.
 * @returns 카테고리 목록 배열
 */
export async function getCategories() {
  const categories = await prisma.category.findMany({
    // 필요한 경우 여기에 정렬 또는 필터링 조건을 추가할 수 있습니다.
    // orderBy: { name_ko: 'asc' } // 예시: 한국어 이름으로 정렬
  });
  return categories;
}

export async function deletePrayer(id: string): Promise<void> {
  await prisma.prayers.delete({
    where: { id },
  });
}
