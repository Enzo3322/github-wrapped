import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      authorization: {
        params: {
          scope: "read:user repo",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account, profile }) {
      if (!account || !profile) return false;

      const githubId = String(profile.id);
      const existingUser = await db.query.users.findFirst({
        where: eq(users.githubId, githubId),
      });

      if (existingUser) {
        await db
          .update(users)
          .set({
            accessToken: account.access_token!,
            avatarUrl: (profile.avatar_url as string) ?? null,
            username: profile.login as string,
            name: (profile.name as string) ?? null,
            updatedAt: new Date(),
          })
          .where(eq(users.githubId, githubId));
      } else {
        await db.insert(users).values({
          githubId,
          username: profile.login as string,
          name: (profile.name as string) ?? null,
          avatarUrl: (profile.avatar_url as string) ?? null,
          accessToken: account.access_token!,
        });
      }

      return true;
    },

    async jwt({ token, profile }) {
      if (profile) {
        token.githubId = String(profile.id);
      }
      return token;
    },

    async session({ session, token }) {
      if (token.githubId) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.githubId, token.githubId as string),
        });
        if (dbUser) {
          (session as unknown as Record<string, unknown>).userId = dbUser.id;
        }
      }
      return session;
    },
  },
});
