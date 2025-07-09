'use server';

import { prisma } from '@/lib/prismaClient';
import { getAuthSession } from '@/lib/auth'; // 사용자가 만든 인증 함수

export async function createResponseAction(
  prayerId: string,
  content: string,
  shareConsent: boolean
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized'); // 인증되지 않은 사용자 처리
  }

  try {
    // 1. 새로운 응답(Response) 생성
    const response = await prisma.responses.create({
      data: {
        prayer_id: prayerId,
        content,
        is_shared: shareConsent,
        responder_id: session.user.id,
        created_at: new Date(),
      },
    });

    // 2. 해당 기도 요청(Prayer)의 상태를 'completed'로 업데이트
    // 응답이 성공적으로 생성된 후에만 기도 요청 상태를 변경합니다.
    await prisma.prayers.update({
      where: {
        id: prayerId, // 응답이 달린 기도 요청의 ID
      },
      data: {
        status: 'completed', // 기도 요청의 상태를 'completed'로 변경
      },
    });

    return response; // 생성된 응답 반환
  } catch (error) {
    console.error('응답 생성 또는 기도 요청 상태 업데이트 중 오류 발생:', error);
    // 오류 발생 시 적절한 에러 메시지 또는 처리를 수행합니다.
    throw new Error('응답 생성 및 기도 요청 상태 업데이트에 실패했습니다.');
  }
}
