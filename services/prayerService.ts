// services/prayerService.ts

import { prisma } from '@/lib/prismaClient';
import { Role, PrayerStatus } from '@prisma/client';

const roleOptions = ['user', 'intercessor', 'admin', 'superadmin'] as const;
type RoleOption = typeof roleOptions[number];

export const prayerService = {
  // 사용자가 intercessions에 추가한 기도만 가져오는 함수
  async getPrayersForIntercession(userId: string) {
    // 1. 사용자가 intercessions에 추가한 기도 가져오기
    // 이 부분이 이제 유일한 데이터 소스가 됩니다.
    const userIntercessions = await prisma.intercessions.findMany({
      where: {
        user_id: userId, // intercessions 테이블에서 해당 사용자가 추가한 항목
      },
      select: {
        prayer: { // intercessions와 연결된 prayer 정보 가져오기
          select: {
            id: true,
            title: true,
            content: true,
            deadline: true, // Date | null
            is_anonymous: true,
            status: true,
            requestedBy: { select: { name: true } }, // 요청자 이름 가져오기
            category: { select: { key: true, name_ko: true, name_en: true } }, // 카테고리 정보
          },
        },
      },
    });

    // intercessions를 통해 가져온 기도들을 평탄화
    const intercessedPrayers = userIntercessions.map(i => i.prayer);

    // 중복 제거 (만약을 위해 유지, 실제로 중복이 발생할 가능성은 낮아지지만 안전하게)
    const combinedPrayersMap = new Map<string, any>();
    intercessedPrayers.forEach(p => combinedPrayersMap.set(p.id, p));

    const combinedPrayers = Array.from(combinedPrayersMap.values()).map(p => ({
      ...p,
      requesterName: p.requestedBy?.name,
      category: p.category?.[`name_ko`] || p.category?.key || 'Uncategorized',
      dueDate: p.deadline
        ? new Date(p.deadline).toLocaleDateString('ko-KR')
        : '마감일 없음', // 마감일이 없는 경우 처리
    }));

    // 정렬 (예: 마감일 기준 오름차순, 마감일 없는 기도는 뒤로)
    combinedPrayers.sort((a, b) => {
      const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return dateA - dateB;
    });

    return combinedPrayers;
  },

  // 이 아래 함수들은 변경 없습니다.
  async updatePrayerStatus(prayerId: string, newStatus: PrayerStatus) {
    const updatedPrayer = await prisma.prayers.update({
      where: { id: prayerId },
      data: { status: newStatus },
      select: { id: true, status: true },
    });
    return updatedPrayer;
  },

  async getSinglePrayer(prayerId: string) {
    const prayer = await prisma.prayers.findUnique({
      where: { id: prayerId },
      select: {
        id: true,
        title: true,
        content: true,
        deadline: true,
        is_anonymous: true,
        status: true,
        requestedBy: { select: { name: true } },
        category: { select: { key: true, name_ko: true, name_en: true } },
      },
    });

    if (!prayer) return null;

    return {
      ...prayer,
      requesterName: prayer.requestedBy?.name,
      category: prayer.category?.[`name_ko`] || prayer.category?.key || 'Uncategorized',
      dueDate: prayer.deadline
        ? new Date(prayer.deadline).toLocaleDateString('ko-KR')
        : '마감일 없음',
    };
  }
};