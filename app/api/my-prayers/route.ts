import { NextResponse } from 'next/server';
import * as myPrayerService from '@/services/myPrayerService';

interface PrayerFormData {
  title: string;
  content: string;
  deadline: string; // YYYY-MM-DD 형식의 문자열
  isAnonymous: boolean;
  categoryId: string;
  requestedBy: string;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const prayers = await myPrayerService.getMyPrayers(userId);
    return NextResponse.json(prayers);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch prayers' }, { status: 500 });
  }
}

// POST 요청 핸들러 (NewPrayerRequestPage에서 사용)
export async function POST(request: Request) {
  try {
    const data: PrayerFormData = await request.json();
    const { title, content, deadline, isAnonymous, categoryId, requestedBy } = data;

    // 필수 필드 유효성 검사
    if (!title || !content || !categoryId || !requestedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // intercessionService를 통해 새로운 기도 요청 생성
    const newPrayer = await myPrayerService.createPrayer({
      title,
      content,
      deadline, // YYYY-MM-DD 문자열 그대로 전달 (서비스에서 Date 객체로 변환)
      isAnonymous,
      categoryId,
      requestedBy,
    });

    return NextResponse.json(newPrayer, { status: 201 }); // 201 Created
  } catch (error: any) {
    console.error('Failed to create prayer request:', error);
    // Prisma 오류 코드에 따른 더 상세한 에러 처리 가능
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await myPrayerService.deletePrayer(id);
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}