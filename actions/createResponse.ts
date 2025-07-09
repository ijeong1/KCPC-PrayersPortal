// app/actions/createResponseAction.ts
'use server'; // Next.js 서버 액션임을 명시

import { prisma } from '@/lib/prismaClient';
import { getAuthSession } from '@/lib/auth'; // 사용자 정의 인증 세션 헬퍼 함수 임포트
import { PrayerStatus } from '@prisma/client'; // Prisma 클라이언트에서 PrayerStatus enum 임포트

export async function createResponseAction(
  prayerId: string, // 기도 ID (문자열)
  content: string,   // 응답 내용 (문자열)
  shareConsent: boolean // 공유 동의 여부 (불리언)
) {
  // 1. 사용자 인증 세션 확인
  const session = await getAuthSession();

  // 세션이 없거나, 사용자 정보가 없거나, 사용자 ID가 없는 경우
  // 이 에러는 클라이언트 측에서 잡아서 사용자에게 적절히 피드백해야 합니다.
  if (!session || !session.user || !session.user.id) {
    throw new Error('Unauthorized: 사용자 인증 세션이 유효하지 않습니다.');
  }

  // 안전한 할당을 위해 세션 사용자 ID를 별도의 변수에 저장
  // TypeScript는 이제 session.user.id가 string임을 알고 있습니다.
  const responderId = session.user.id;

  try {
    // 2. 새로운 응답(Response) 생성
    // 데이터베이스의 `responses` 테이블에 새로운 기록을 추가합니다.
    const response = await prisma.responses.create({
      data: {
        prayer_id: prayerId,        // 연결된 기도 요청의 ID
        content: content,           // 응답 내용
        is_shared: shareConsent,    // 공유 동의 여부
        responder_id: responderId,  // 응답을 작성한 사용자의 ID
        created_at: new Date(),     // 현재 시간으로 생성 시간 기록
      },
    });

    // 3. 해당 기도 요청(Prayer)의 상태를 'COMPLETED'로 업데이트
    // 응답이 성공적으로 생성된 후에만 기도 요청의 상태를 변경합니다.
    await prisma.prayers.update({
      where: {
        id: prayerId, // 응답이 달린 특정 기도 요청을 식별
      },
      data: {
        status: PrayerStatus.COMPLETED, // 기도 요청 상태를 `COMPLETED`로 변경
      },
    });

    // 4. 성공 시 생성된 응답 객체 반환
    return response;

  } catch (error) {
    // 5. 오류 처리: 예외 발생 시 콘솔에 상세 에러 로깅
    console.error('서버 액션 오류: 응답 생성 또는 기도 요청 상태 업데이트 중 문제 발생:', error);

    // 클라이언트에게 전달할 구체적인 에러 메시지를 throw합니다.
    // 이는 UI에서 사용자에게 표시될 수 있습니다.
    // 에러 객체가 Error 인스턴스인 경우 메시지를 포함할 수 있습니다.
    if (error instanceof Error) {
      throw new Error(`응답 생성 및 기도 요청 상태 업데이트에 실패했습니다: ${error.message}`);
    } else {
      throw new Error('알 수 없는 오류로 응답 생성 및 기도 요청 상태 업데이트에 실패했습니다.');
    }
  }
}