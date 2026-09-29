import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
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
