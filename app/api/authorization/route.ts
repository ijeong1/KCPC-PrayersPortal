import { NextResponse } from 'next/server';
import * as adminService from '@/services/adminService';
import { Role } from '@prisma/client';

// GET 요청: 사용자 목록을 페이지네이션하여 가져옵니다.
// 예시: GET /api/authorization?page=1&pageSize=20
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '20');

    const data = await adminService.getUsersWithPagination(page, pageSize);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// PATCH 요청: 특정 사용자의 역할을 업데이트합니다.
// 예시: PATCH /api/authorization
// 요청 본문: { "userId": "some-user-id", "newRole": "ADMIN", "currentUserRole": "USER" }
export async function PATCH(request: Request) {
  try {
    // userId를 요청 본문(body)에서 직접 파싱합니다.
    const { userId, newRole, currentUserRole } = await request.json();

    // 필수 필드 유효성 검사 (추가)
    if (!userId || !newRole || !currentUserRole) {
      return NextResponse.json({ error: 'Missing required fields: userId, newRole, or currentUserRole' }, { status: 400 });
    }

    // Role enum 유효성 검사
    if (!Object.values(Role).includes(newRole)) {
      return NextResponse.json({ error: 'Invalid newRole provided' }, { status: 400 });
    }
    if (!Object.values(Role).includes(currentUserRole)) {
      return NextResponse.json({ error: 'Invalid currentUserRole provided' }, { status: 400 });
    }

    const updatedUser = await adminService.updateUserRole(
      userId,
      newRole as Role,
      currentUserRole as Role
    );

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Failed to update role:', error);
    return NextResponse.json({ error: error.message || 'Failed to update role' }, { status: 500 });
  }
}

// DELETE 요청: 특정 사용자를 삭제합니다.
// 예시: DELETE /api/authorization
// 요청 본문: { "userId": "some-user-id" }
export async function DELETE(request: Request) {
  try {
    // userId를 요청 본문(body)에서 직접 파싱합니다.
    const { userId } = await request.json();

    // 필수 필드 유효성 검사 (추가)
    if (!userId) {
      return NextResponse.json({ error: 'Missing required field: userId' }, { status: 400 });
    }

    await adminService.deleteUser(userId);

    return NextResponse.json({ success: true, message: `User ${userId} deleted successfully.` });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}