"use server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prismaClient";

export async function getMyProfile() {
  const session = await getAuthSession();

  // If session is not available or user name is not set, return loggedIn as false
  console.log("getMyProfile session ", session);

  if (!session?.user?.name) {
    return { loggedIn: false, profile: null };
  }

  const profile = await prisma.profiles.findUnique({
    // where: { id: session.user.id },
    where: { id: session.user.id },
  });
  return { loggedIn: true, profile };
}
