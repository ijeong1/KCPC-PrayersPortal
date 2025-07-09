"use server";

import { prisma } from "@/lib/prismaClient";
import { getAuthSession } from "@/lib/auth";

// enum Role {
//   superadmin,
//   admin,
//   intercessor,
//   user,
// }

export async function updateProfileInfo({
  name,
  email,
}: // role,
{
  name: string;
  email: string;
  // role: Role;
}) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await prisma.profiles.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
        // role,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Update profile failed:", error);
    return { success: false, message: "Server error" };
  }
}
