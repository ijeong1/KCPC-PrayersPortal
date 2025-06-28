import { NextResponse } from 'next/server';
import * as adminService from '@/services/adminService';
import { Role } from '@prisma/client';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params; // await 해야 params 꺼낼 수 있음
    const { newRole, currentUserRole } = await request.json();

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

export async function DELETE(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    await adminService.deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}