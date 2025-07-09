// services/adminService.ts

import { prisma } from '@/lib/prismaClient';
import { Role } from '@prisma/client';
// import { getServerSession } from 'next-auth'; // 필요하다면 세션 임포트
// import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // NextAuth.js 설정

// Role 배열은 타입 추론이 더 잘 되도록 const assertion 사용
const roleOptions = ['user', 'intercessor', 'admin', 'superadmin'] as const;
type RoleOption = typeof roleOptions[number]; // 'user' | 'intercessor' | 'admin' | 'superadmin'

// -- getUsersWithPagination 함수 --
export async function getUsersWithPagination(
  page: number,
  pageSize: number,
  search: string,
  roleFilter: string
) {
  const skip = (page - 1) * pageSize;

  let whereClause: any = {};

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Role enum 값에 해당하는지 확인 후 적용
  if (roleFilter && roleFilter !== 'all' && Object.values(Role).includes(roleFilter as Role)) {
    whereClause.role = roleFilter as Role;
  }

  // 👇 추가: admin 또는 superadmin 역할은 제외
  whereClause.role = {
    notIn: ['admin', 'superadmin'] // 'admin'과 'superadmin' 역할을 가진 사용자를 제외합니다.
  };

  // 만약 기존 roleFilter가 있다면 AND 조건으로 합칩니다.
  if (roleFilter && roleFilter !== 'all' && Object.values(Role).includes(roleFilter as Role)) {
      whereClause.AND = whereClause.AND ? [...whereClause.AND, { role: roleFilter as Role }] : [{ role: roleFilter as Role }];
  }
  // 검색 조건도 AND로 합쳐야 할 수 있습니다.
  // 현재 OR 조건은 'name' 또는 'email'에 대해 검색이므로, 다른 where 조건과 합치려면
  // Prisma의 AND/OR/NOT 조합을 사용해야 합니다.
  // 이 부분은 기존 OR 조건과 새롭게 추가된 role 'notIn' 조건을 함께 적용하는 예시입니다.
  // 주의: Prisma의 where 절 복합 조건은 좀 더 복잡하게 구성될 수 있습니다.

  // 최종 whereClause를 다시 구성하는 더 명확한 방법
  const finalWhereClause: any = {
    role: {
      notIn: ['admin', 'superadmin'] as Role[] // admin과 superadmin은 항상 제외
    }
  };

  // 검색 조건 추가
  if (search) {
    finalWhereClause.AND = finalWhereClause.AND || [];
    finalWhereClause.AND.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    });
  }

  // 역할 필터 조건 추가 (admin/superadmin이 아닌 경우만)
  if (roleFilter && roleFilter !== 'all' && Object.values(Role).includes(roleFilter as Role)) {
    // roleFilter가 'admin' 또는 'superadmin'이면 이 조건은 적용되지 않습니다.
    // 하지만 위에 notIn으로 이미 제외했으므로 필터링할 일이 없습니다.
    // 'user'나 'intercessor'만 필터링될 것입니다.
    finalWhereClause.AND = finalWhereClause.AND || [];
    finalWhereClause.AND.push({ role: roleFilter as Role });
  }


  const totalCount = await prisma.profiles.count({ where: finalWhereClause }); // 수정된 whereClause 사용
  const users = await prisma.profiles.findMany({
    where: finalWhereClause, // 수정된 whereClause 사용
    skip: skip,
    take: pageSize,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return { users, totalCount };
}


// -- updateUserRole 함수 --
export async function updateUserRole(
  userId: string,
  newRole: Role, // 이 newRole은 이미 Role 타입
  currentUserRole: Role // 이 currentUserRole도 이미 Role 타입
) {
  // 실제 세션에서 가져오는 currentUserRole이 Role 타입이 아닐 수 있으므로 확인 필요
  // 예시: const actualCurrentUserRole = (await getServerSession(authOptions))?.user?.role as Role;

  // 1. currentUserRole의 레벨을 계산할 때 RoleOption으로 타입 캐스팅
  const currentRoleLevel = roleOptions.indexOf(currentUserRole as RoleOption);
  const newRoleLevel = roleOptions.indexOf(newRole as RoleOption);

  if (currentRoleLevel < newRoleLevel || (currentUserRole !== 'admin' && currentUserRole !== 'superadmin')) {
    throw new Error('Unauthorized: Insufficient permissions to change roles.');
  }

  const targetUser = await prisma.profiles.findUnique({ where: { id: userId } });
  if (!targetUser) {
    throw new Error('User not found.');
  }

  // 2. targetUser.role의 레벨을 계산할 때 RoleOption으로 타입 캐스팅
  // targetUser.role이 null일 수 있으므로 'user'로 대체 후 캐스팅
  const targetUserRoleLevel = roleOptions.indexOf((targetUser.role || 'user') as RoleOption);

  if (currentRoleLevel <= targetUserRoleLevel) {
    throw new Error('Unauthorized: Cannot change role of user with equal or higher privilege.');
  }

  const updatedUser = await prisma.profiles.update({
    where: { id: userId },
    data: { role: newRole },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
  return updatedUser;
}

// -- deleteUser 함수 --
export async function deleteUser(userId: string) {
  // 실제 세션에서 가져오는 currentUserRole 확인 필요
  // 예시: const actualCurrentUserRole = (await getServerSession(authOptions))?.user?.role as Role;

  const roleOptions: Role[] = ['user', 'intercessor', 'admin', 'superadmin']; // 이 배열은 Role[] 타입
  
  const targetUser = await prisma.profiles.findUnique({ where: { id: userId } });
  if (!targetUser) {
    throw new Error('User not found.');
  }

  // 1. 서버에서 가져온 실제 사용자 역할 (currentUserRoleForDeletion)을 사용하여 레벨 계산
  // 이 부분은 클라이언트에서 넘어온 'currentUserRole'을 쓰는 것이 아니라,
  // 서버에서 NextAuth.js 세션을 통해 실제 역할 데이터를 가져와야 합니다.
  // 이 예시에서는 임시로 'admin'을 사용했지만, 반드시 실제 세션 데이터를 사용하세요.
  const currentUserRoleForDeletion: Role = 'admin'; // FIXME: 실제 getServerSession() 결과에서 가져와야 함
  const currentUserLevelForDeletion = roleOptions.indexOf(currentUserRoleForDeletion as RoleOption);


  // 2. targetUser.role의 레벨을 계산할 때 RoleOption으로 타입 캐스팅
  const targetUserRoleLevel = roleOptions.indexOf((targetUser.role || 'user') as RoleOption);

  if (currentUserLevelForDeletion <= targetUserRoleLevel) {
    throw new Error('Unauthorized: Cannot delete user with equal or higher privilege.');
  }

  await prisma.profiles.delete({
    where: { id: userId },
  });
}