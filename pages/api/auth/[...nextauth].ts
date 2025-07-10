// app/api/auth/[...nextauth]/route.ts

import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prismaClient";
import { Role } from '@prisma/client';
import { createJwt } from "@/lib/createJwt";

// NextAuth 타입 확장을 위한 선언
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role?: Role;
            agreed_to_pledge?: boolean; // 이 부분은 boolean | null로 바꿔도 되지만, 아래에서 null 처리하는 게 더 명확합니다.
            provider?: string;
            auth_provider_id?: string;
        };
    }

    interface User {
        id: string;
        role?: Role;
        agreed_to_pledge?: boolean; // 이 부분도 마찬가지입니다.
        provider?: string;
        auth_provider_id?: string;
    }
}

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (!user.email || !account?.providerAccountId) return false;

            const existing = await prisma.profiles.findUnique({
                where: {
                    provider: account.provider,
                    auth_provider_id: account.providerAccountId,
                },
            });

            if (!existing) {
                await prisma.profiles.create({
                    data: {
                        name: user.name ?? "Unknown User",
                        email: user.email,
                        provider: account.provider,
                        auth_provider_id: account.providerAccountId,
                        role: 'user',
                        agreed_to_pledge: false, // 기본값은 false로 설정합니다.
                    },
                });
            }

            return true;
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.sub = user.id;
                
                // 우리가 서명한 커스텀 JWT 생성
                token.accessToken = await createJwt({
                    sub: user.id,
                    email: user.email,
                    name: user.name,
                });
            }
            return token;
        },
        async session({ session, token }) {
            if (!session.user?.email) return session;

            const profile = await prisma.profiles.findFirst({
                where: { email: session.user.email },
            });

            if (profile) {
                session.user.id = profile.id;

                const validRoles = Object.values(Role);
                if (profile.role && validRoles.includes(profile.role as Role)) {
                    session.user.role = profile.role as Role;
                } else {
                    session.user.role = Role.user;
                }

                // --- FIX STARTS HERE ---
                // profile.agreed_to_pledge가 null일 수 있으므로, 명시적으로 boolean으로 처리합니다.
                session.user.agreed_to_pledge = profile.agreed_to_pledge ?? false;
                // --- FIX ENDS HERE ---

                session.user.provider = profile.provider;
                session.user.auth_provider_id = profile.auth_provider_id;
            }

            session.accessToken = token.accessToken as string | undefined

            return session;
        },
    },
};

export default NextAuth(authOptions);