import { NextResponse } from 'next/server';
import * as adminService from '@/services/adminService';
import { Role } from '@prisma/client';

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

export async function PATCH(request: Request,{ params }: { params: { userId: string } }) {
  try {
    const userId = params.userId;
    const { newRole, currentUserRole } = await request.json();

    console.log('Updating role for user:', userId, 'to', newRole, 'by', currentUserRole);
    

    if (!Object.values(Role).includes(newRole)) {
      return NextResponse.json({ error: 'Invalid newRole' }, { status: 400 });
    }
    if (!Object.values(Role).includes(currentUserRole)) {
      return NextResponse.json({ error: 'Invalid currentUserRole' }, { status: 400 });
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