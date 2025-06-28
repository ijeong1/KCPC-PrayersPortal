
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]"; // authOptions 가져오기
import { redirect } from "next/navigation";
import AdminPageClient from "@/components/AdminPageClient";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    redirect("/"); // 권한 없으면 홈으로 보내버림
  }

  return (
    // 이 페이지는 관리자 페이지로 getServerSession을 통해 세션을 확인하고,
    // 세션이 없거나 권한이 없는 경우 홈으로 리다이렉트
    // 하지만 관리자 페이지 내부의 경우는 Client Component로 구현되어야 하므로
    // 이 부분은 서버 컴포넌트로 작성되어야 합니다.
    <AdminPageClient />
  );
}
