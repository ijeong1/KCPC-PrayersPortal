import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "superadmin" | "admin" | "intercessor" | "user";
      agreed_to_pledge?: boolean;
      provider?: string;
      auth_provider_id?: string;
    };
  }
}