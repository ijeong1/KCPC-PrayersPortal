import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

export async function getAuthSession() {
    return await getServerSession(authOptions);
}