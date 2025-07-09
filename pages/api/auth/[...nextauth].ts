import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prismaClient";

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
                const fullName = user.name ?? 'Unknown User';

                await prisma.profiles.create({
                    data: {
                        name: user.name ?? "Unknown User",
                        email: user.email,
                        provider: account.provider,
                        auth_provider_id: account.providerAccountId,
                        role: 'user',
                        agreed_to_pledge: false,
                    },
                });
            }

            return true;
        },
        async session({ session }) {
            if (!session.user?.email) return session;

            const profile = await prisma.profiles.findFirst({
                where: { email: session.user.email },
            });

            if (profile) {
                session.user.id = profile.id;
                session.user.role = profile.role ?? "user";
                session.user.agreed_to_pledge = profile.agreed_to_pledge;
                session.user.provider = profile.provider;
                session.user.auth_provider_id = profile.auth_provider_id;
            }

            return session;
        },
    },
};

export default NextAuth(authOptions);
