import NextAuth from "next-auth";
import { Role, PrayerStatus } from '@prisma/client';

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: Role; // Role 타입을 사용
      agreed_to_pledge?: boolean;
      provider?: string;
      auth_provider_id?: string;
    };
    accessToken?: string; // JWT 토큰 추가
  }
}