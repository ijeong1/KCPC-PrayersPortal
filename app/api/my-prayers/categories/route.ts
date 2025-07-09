// api/my-prayers/categories/route.ts
import { NextResponse } from 'next/server';
import * as myPrayerService from '@/services/myPrayerService'; // myPrayerService 임포트

/**
 * GET 요청을 처리하여 모든 기도 카테고리 목록을 반환합니다.
 * 이 API는 인증이 필요 없는 공개 API로 가정합니다.
 */
export async function GET() {
  try {
    const categories = await myPrayerService.getCategories(); // 서비스 함수를 사용하여 카테고리 가져오기
    return NextResponse.json(categories, { status: 200 }); // 200 OK 상태 코드와 함께 카테고리 목록 반환
  } catch (error) {
    console.error('카테고리 가져오기 중 API 오류:', error); // 오류 로깅
    return NextResponse.json(
      { error: '카테고리를 가져오는 데 실패했습니다.', detail: (error as Error).message },
      { status: 500 } // 500 Internal Server Error 상태 코드 반환
    );
  }
}
