import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";

const googleClientId =
  process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_ID || "";
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SECRET || "";

if (!googleClientId || !googleClientSecret) {
  console.warn(
    "[auth] Missing Google OAuth credentials — set AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET (or GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET) in Vercel. Google login will return invalid_client until configured."
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: googleClientId || "missing_google_client_id",
      clientSecret: googleClientSecret || "missing_google_client_secret",
      allowDangerousEmailAccountLinking: true,
    }),
    // OWASP-compliant dev-only mock — tree-shaken in production (Vercel sets NODE_ENV=production)
    ...(process.env.NODE_ENV === "development"
      ? [
          Credentials({
            id: "credentials",
            name: "Dev Login",
            credentials: {
              email: { label: "Email", type: "email", placeholder: "dev@launchai.pro" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              if (process.env.NODE_ENV !== "development") return null;
              const email = (credentials?.email as string)?.trim().toLowerCase();
              const password = credentials?.password as string;
              if (email === "dev@launchai.pro" && password === "dev1234") {
                return { id: "dev-user-1", name: "Dev User", email: "dev@launchai.pro" };
              }
              return null;
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token?.id) {
        (session.user as unknown as { id: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
