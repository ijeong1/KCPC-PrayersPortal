// app/api/intercessions/pray/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// NextAuth.js 설정 파일의 실제 경로로 바꿔주세요.
// 일반적으로 src/app/api/auth/[...nextauth]/route.ts 또는 pages/api/auth/[...nextauth].ts 입니다.
import { authOptions } from "@/pages/api/auth/[...nextauth]"; // authOptions 가져오기
import { prayerService } from '@/services/prayerService'; // 이전에 정의한 prayerService 임포트
import { PrayerStatus } from '@prisma/client'; // PrayerStatus enum 임포트

/**
 * GET 요청 핸들러: 현재 로그인한 사용자의 모든 중보 대상 기도 목록을 가져옵니다.
 *
 * 이 API는 사용자가 직접 작성한 기도와,
 * 사용자가 'intercessions' 테이블을 통해 중보 목록에 추가한 기도를 모두 합쳐서 반환합니다.
 *
 * @returns {NextResponse} 기도 목록 (성공 시 200 OK), 또는 에러 응답 (401 Unauthorized, 500 Internal Server Error)
 *
 * 예시: GET /api/intercessions/pray
 */
export async function GET(request: Request) {
  try {
    // 1. 사용자 세션 확인
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      // 세션이 없거나 사용자 ID를 찾을 수 없으면 인증되지 않음 응답
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. prayerService를 사용하여 기도 목록 가져오기
    // 이 함수는 사용자가 작성한 기도와 중보 목록에 추가한 기도를 모두 가져옵니다.
    const prayers = await prayerService.getPrayersForIntercession(userId);

    // 3. 성공 응답 반환
    return NextResponse.json(prayers, { status: 200 });

  } catch (error) {
    // 4. 에러 로깅 및 에러 응답 반환
    console.error('API Error: Failed to fetch prayers for intercession:', error);
    // 운영 환경에서는 상세한 에러 메시지를 클라이언트에게 노출하지 않는 것이 좋습니다.
    return NextResponse.json({ message: '기도 목록을 불러오는 데 실패했습니다.' }, { status: 500 });
  }
}

/**
 * PATCH 요청 핸들러: 특정 기도의 상태를 업데이트합니다.
 * (예: PENDING -> IN_PROGRESS, IN_PROGRESS -> COMPLETED)
 *
 * 요청 본문: { "prayerId": "some-prayer-id", "status": "IN_PROGRESS" }
 *
 * @param {Request} request - Next.js Request 객체 (요청 본문 포함)
 * @returns {NextResponse} 업데이트된 기도 정보 (성공 시 200 OK), 또는 에러 응답 (400 Bad Request, 401 Unauthorized, 500 Internal Server Error)
 *
 * 예시: PATCH /api/intercessions/pray
 */
export async function PATCH(request: Request) {
  try {
    // 1. 사용자 세션 확인 (GET과 동일)
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. 요청 본문 파싱
    const { prayerId, status } = await request.json();

    // 3. 데이터 유효성 검사
    if (!prayerId || typeof prayerId !== 'string') {
      return NextResponse.json({ message: '유효한 prayerId가 필요합니다.' }, { status: 400 });
    }
    // `PrayerStatus` enum에 포함되는 유효한 상태 값인지 확인
    if (!status || !Object.values(PrayerStatus).includes(status)) {
      return NextResponse.json({ message: '유효한 기도 상태(status)가 필요합니다.' }, { status: 400 });
    }

    // 4. prayerService를 사용하여 기도의 상태 업데이트
    // userId는 여기서는 직접 사용되지 않지만, 만약 특정 사용자만이 자신의 기도 상태를 업데이트할 수 있도록
    // 권한 검증을 추가하려면 prayerService.updatePrayerStatus 함수 내에서 이를 수행해야 합니다.
    const updatedPrayer = await prayerService.updatePrayerStatus(prayerId, status as PrayerStatus);

    // 5. 성공 응답 반환
    return NextResponse.json({ success: true, updatedPrayer }, { status: 200 });

  } catch (error) {
    // 6. 에러 로깅 및 에러 응답 반환
    console.error('API Error: Failed to update prayer status:', error);
    // Prisma 관련 에러 등 특정 에러 타입에 따라 더 구체적인 메시지를 반환할 수 있습니다.
    return NextResponse.json({ message: '기도 상태를 업데이트하는 데 실패했습니다.' }, { status: 500 });
  }
}