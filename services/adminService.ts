import { prisma } from '@/lib/prismaClient';
import { Role } from   '@prisma/client';

const roleHierarchy: Record<Role, number> = {
  superadmin: 3,
  admin: 2,
  intercessor: 1,
  user: 0,
};

export async function getUsersWithPagination(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  const [users, totalCount] = await Promise.all([
    prisma.profiles.findMany({
        where: {
            NOT: [ 
                { role: 'superadmin'},
                { role: 'admin'}
            ]},
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        provider: true,
        auth_provider_id: true,
        created_at: true,
      },
    }),
    prisma.profiles.count({
        where: {
            NOT: [ 
                { role: 'superadmin'},
                { role: 'admin'}
            ]
        },
    }),
  ]);

  return { users, totalCount };
}

export async function updateUserRole(userId: string, newRole: Role, currentUserRole: Role) {
  const newRoleLevel = roleHierarchy[newRole];
  const currentUserLevel = roleHierarchy[currentUserRole];


  if (newRoleLevel === -1) {
    throw new Error('Invalid role');
  }

  if (newRoleLevel > currentUserLevel) {
    throw new Error('You do not have permission to assign this role.');
  }

  const updatedUser = await prisma.profiles.update({
    where: { id: userId },
    data: { role: newRole },
  });

  return updatedUser;
}

export async function deleteUser(userId: string) {
  const user = await prisma.profiles.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if the user is a superadmin or admin
  if (user.role === 'superadmin' || user.role === 'admin') {
    throw new Error('Cannot delete superadmin or admin users');
  }

  await prisma.profiles.delete({
    where: { id: userId },
  });
}