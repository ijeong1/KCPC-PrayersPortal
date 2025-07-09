// app/api/intercessions/list/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/pages/api/auth/[...nextauth]"; // authOptions 가져오기 // NextAuth.js 설정 경로
import { intercessionListService } from '@/services/intercessionListService'; // 위에서 정의한 서비스

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const savedPrayers = await intercessionListService.getSavedIntercessionList(userId);

    return NextResponse.json(savedPrayers, { status: 200 });
  } catch (error) {
    console.error('API Error: Failed to fetch saved intercession list:', error);
    return NextResponse.json({ message: '저장된 기도 목록을 불러오는 데 실패했습니다.' }, { status: 500 });
  }
}