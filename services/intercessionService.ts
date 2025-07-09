// services/intercessionService.ts
import { prisma } from '@/lib/prismaClient'; // Prisma Client 임포트

// API 응답과 유사하게 반환 타입을 정의합니다.
interface PrayerListResult {
  prayers: {
    id: string;
    title: string;
    description: string; // content를 description으로 매핑
    category: string; // category.key
    dueDate: string; // deadline
    requesterName: string; // profiles.name
    is_anonymous: boolean | null;
  }[];
  totalCount: number;
}

// category model에 key, name_en, name_ko가 있다고 가정합니다.
interface Category {
  id: string;
  key: string;
  name_en: string;
  name_ko: string;
}

export const intercessionService = {
  /**
   * 필터링, 검색, 정렬 및 페이지네이션을 적용하여 중보기도 목록을 가져옵니다.
   * 또한, 요청자가 현재 로그인한 사용자인 기도는 제외합니다.
   */
  async getFilteredAndPaginatedPrayers({
    search = '',
    category = '',
    sort = 'latest',
    page = 1,
    limit = 10,
    currentUserId, // 현재 로그인한 사용자 ID 추가
  }: {
    search?: string;
    category?: string;
    sort?: string;
    page?: number;
    limit?: number;
    currentUserId?: string;
  }): Promise<PrayerListResult> {
    const skip = (page - 1) * limit;

    let whereClause: any = {
      status: 'PENDING', // PENDING 상태의 기도만 가져온다고 가정
    };

    // 검색어 필터링 (제목 또는 내용에 포함)
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 카테고리 필터링
    if (category && category !== 'all') {
      whereClause.category = {
        key: category,
      };
    }

    // 요청자가 현재 로그인한 사용자인 경우 해당 기도를 제외
    if (currentUserId) {
      whereClause.NOT = {
        requested_by: currentUserId,
      };
    }

    let orderByClause: any = {};
    if (sort === 'dueDateAsc') {
      orderByClause.deadline = 'asc';
    } else {
      // 'latest' (최신순): created_at 내림차순 정렬
      orderByClause.created_at = 'desc';
    }

    try {
      // 총 기도 수 조회 (페이지네이션을 위해)
      const totalCount = await prisma.prayers.count({
        where: whereClause,
      });

      // 실제 기도 목록 조회
      const prayers = await prisma.prayers.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip: skip,
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          deadline: true,
          is_anonymous: true,
          requested_by: true, // 요청자 ID도 가져와서 추후 익명 처리
          category: {
            select: {
              key: true,
              name_en: true,
              name_ko: true,
            },
          },
          requestedBy: {
            select: {
              name: true,
            },
          },
        },
      });

      // 프론트엔드 인터페이스에 맞게 데이터 가공
      const formattedPrayers = prayers.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.content, // 'content'를 'description'으로 매핑
        category: p.category ? p.category.key : 'uncategorized',
        dueDate: p.deadline ? p.deadline.toISOString().split('T')[0] : 'N/A', // 날짜 형식 지정
        requesterName: p.is_anonymous ? '***' : p.requestedBy.name, // 익명 처리
        is_anonymous: p.is_anonymous,
      }));

      return { prayers: formattedPrayers, totalCount };
    } catch (error) {
      console.error('Error fetching filtered and paginated prayers:', error);
      throw new Error('Failed to fetch prayers.');
    }
  },

  /**
   * 특정 사용자가 저장한 기도(intercessions)의 ID 목록을 가져옵니다.
   */
  async getMyIntercessions(userId: string): Promise<string[]> {
    try {
      const savedIntercessions = await prisma.intercessions.findMany({
        where: {
          user_id: userId,
        },
        select: {
          prayer_id: true,
        },
      });
      return savedIntercessions.map((i) => i.prayer_id);
    } catch (error) {
      console.error('Error fetching my intercessions:', error);
      throw new Error('Failed to fetch user saved prayers.');
    }
  },

  /**
   * 사용자의 기도 목록에 기도를 추가합니다.
   */
  async addPrayerToMyList(userId: string, prayerId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if the prayer is already saved for this user
      const existingIntercession = await prisma.intercessions.findUnique({
        where: {
          // *** THIS IS THE CORRECT SYNTAX FOR YOUR COMPOSITE UNIQUE KEY ***
          user_id_prayer_id: { // Use the name you defined (or Prisma's default)
            user_id: userId,
            prayer_id: prayerId,
          },
        },
      });

      if (existingIntercession) {
        return { success: false, message: 'Prayer already saved.' };
      }

      // If not existing, create the new intercession record
      await prisma.intercessions.create({
        data: {
          user_id: userId,
          prayer_id: prayerId,
        },
      });
      return { success: true, message: 'Prayer saved successfully.' };
    } catch (error) {
      console.error('Error adding prayer to my list:', error);
      // You might want to check for specific error codes for database unique constraint violations
      // For example, if using PostgreSQL, error.code might be 'P2002' for unique constraint failed
      return { success: false, message: 'Failed to save prayer.' };
    }
  },

  /**
   * 사용자의 기도 목록에서 기도를 제거합니다.
   */
  async removePrayerFromMyList(userId: string, prayerId: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await prisma.intercessions.deleteMany({
        where: {
          user_id: userId,
          prayer_id: prayerId,
        },
      });

      if (result.count === 0) {
        return { success: false, message: 'Prayer not found in your list.' };
      }
      return { success: true, message: 'Prayer removed successfully.' };
    } catch (error) {
      console.error('Error removing prayer from my list:', error);
      return { success: false, message: 'Failed to remove prayer.' };
    }
  },

  /**
   * 카테고리 목록을 가져옵니다.
   */
  async getCategories(): Promise<Category[]> {
    try {
      const categories = await prisma.category.findMany({
        select: {
          id: true,
          key: true,
          name_en: true,
          name_ko: true,
        },
        orderBy: {
          name_en: 'asc', // 알파벳 순 정렬 예시
        }
      });
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories.');
    }
  },
};