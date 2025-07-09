// app/api/intercessions/route.ts
import { NextResponse } from 'next/server';
import { intercessionService } from '@/services/intercessionService'; // 서비스 임포트

// ServiceResult 인터페이스는 POST/DELETE 응답을 위해 그대로 유지합니다.
interface ServiceResult {
  success: boolean;
  message: string;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || '';
    const sort = url.searchParams.get('sort') || 'latest';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const userId = url.searchParams.get('userId'); // 로그인한 사용자 ID

    // 1. 조건에 맞는 전체 중보기도 목록 가져오기 (요청자가 현재 사용자인 기도는 제외)
    // intercessionService.getFilteredAndPaginatedPrayers 함수에 currentUserId를 전달하여 본인 기도 제외
    const { prayers, totalCount } = await intercessionService.getFilteredAndPaginatedPrayers({
      search,
      category,
      sort,
      page,
      limit,
      currentUserId: userId ?? undefined, // userId가 있으면 전달, 없으면 undefined
    });

    let savedPrayerIds: string[] = [];
    // 2. 로그인한 사용자의 저장된 기도 ID 목록 가져오기 (userId가 있는 경우에만)
    if (userId) {
      savedPrayerIds = await intercessionService.getMyIntercessions(userId);
    }

    // 두 정보를 함께 응답으로 반환
    return NextResponse.json({ prayers, savedPrayerIds, totalCount }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Failed to fetch intercessions:', error);
    // 에러 발생 시 프론트엔드에서 처리하기 쉽도록 빈 배열과 0을 반환
    return NextResponse.json({ message: 'Internal Server Error', prayers: [], savedPrayerIds: [], totalCount: 0 }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, prayerId } = await req.json();

    if (!userId || !prayerId) {
      return NextResponse.json({ success: false, message: 'Invalid request: userId and prayerId are required.' }, { status: 400 });
    }

    const result: ServiceResult = await intercessionService.addPrayerToMyList(userId, prayerId);
    if (!result.success) {
      // 서비스에서 반환된 실패 메시지를 사용 (예: 이미 저장된 기도)
      // 409 Conflict 상태 코드는 리소스 충돌(여기서는 이미 저장된 기도)을 나타내기에 적절합니다.
      return NextResponse.json(result, { status: 409 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Failed to save prayer to my list:', error);
    // 데이터베이스 에러 등 서버 내부 오류
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const prayerId = searchParams.get('prayerId');

    if (!userId || !prayerId) {
      return NextResponse.json({ success: false, message: 'Invalid request: userId and prayerId are required.' }, { status: 400 });
    }

    const result: ServiceResult = await intercessionService.removePrayerFromMyList(userId, prayerId);
    if (!result.success) {
      // 서비스에서 반환된 실패 메시지를 사용 (예: 존재하지 않는 기도)
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Failed to remove prayer from my list:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}