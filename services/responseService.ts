// lib/services/responseService.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Step 1: 실제 쿼리를 수행하여 TypeScript가 반환 타입을 추론하도록 합니다.
// 이 쿼리는 실행되지 않고, 오직 타입 추론만을 위한 "더미" 쿼리입니다.
const _dummySharedResponseQuery = prisma.responses.findMany({
  where: { is_shared: true }, // 조건은 실제 쿼리와 동일하게
  include: {
    prayers: {
      include: {
        category: true,
        requestedBy: {
          select: {
            name: true,
          },
        },
      },
    },
  },
});

// Step 2: 추론된 Promise 타입을 Awaited를 사용하여 실제 데이터 타입으로 변환하고,
// 배열에서 단일 요소의 타입을 추출합니다.
export type SharedResponsePayload = Awaited<typeof _dummySharedResponseQuery>[number];

export async function getSharedResponsesFromDb(): Promise<SharedResponsePayload[]> {
  const responses = await prisma.responses.findMany({
    where: {
      is_shared: true,
    },
    include: {
      prayers: {
        include: {
          category: true,
          requestedBy: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  // Prisma 쿼리 결과는 이미 SharedResponsePayload[] 타입이므로,
  // 추가적인 `as SharedResponsePayload[]` 타입 캐스팅이 필요 없습니다.
  return responses;
}