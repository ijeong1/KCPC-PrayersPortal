// services/intercessionListService.ts (새로 생성)
import { prisma } from '@/lib/prismaClient';

export const intercessionListService = {
  // 사용자가 '내 목록'에 저장한 기도들을 가져오는 함수
  async getSavedIntercessionList(userId: string) {
    const savedIntercessions = await prisma.intercessions.findMany({
      where: {
        user_id: userId, // 현재 로그인한 사용자 ID와 연결된 intercession 항목
      },
      select: {
        prayer: { // intercessions 테이블과 연결된 prayer 테이블의 데이터 선택
          select: {
            id: true,
            title: true,
            content: true,
            deadline: true,
            is_anonymous: true,
            status: true,
            requestedBy: { select: { name: true } }, // 요청자 정보
            category: { select: { key: true, name_ko: true, name_en: true } }, // 카테고리 정보
            // 필요하다면 여기에 intercessions 자체의 created_at 등도 추가 가능
          },
        },
      },
      orderBy: {
        created_at: 'desc', // 최근에 저장된 순서로 정렬
      },
    });

    // 중보기도 항목들을 평탄화하고 필요한 데이터로 가공
    const intercessionPrayers = savedIntercessions
      .filter(item => item.prayer !== null) // 혹시 prayer가 null인 경우가 있다면 필터링
      .map(item => ({
        id: item.prayer.id,
        title: item.prayer.title,
        content: item.prayer.content,
        // Prisma에서 Date 객체로 오므로, 클라이언트에서 사용할 문자열로 포맷팅
        dueDate: item.prayer.deadline
          ? new Date(item.prayer.deadline).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
          : '마감일 없음',
        requesterName: item.prayer.is_anonymous ? '익명' : item.prayer.requestedBy?.name || '알 수 없음',
        category: item.prayer.category?.name_ko || item.prayer.category?.key || '미분류',
        status: item.prayer.status,
        // 기타 필요한 필드 추가
      }));

    return intercessionPrayers;
  },

  // '내 목록'에서 기도를 삭제하는 함수 (예시)
  async removeIntercession(userId: string, prayerId: string) {
    await prisma.intercessions.deleteMany({ // deleteMany를 사용하는 이유는 복합 키가 없으므로 (user_id, prayer_id)로 삭제
      where: {
        user_id: userId,
        prayer_id: prayerId,
      },
    });
    return { success: true };
  }
};