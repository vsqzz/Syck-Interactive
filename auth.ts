import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import { upsertUser } from "@/lib/users"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        token.discordId = (profile as any).id
        token.avatar = (profile as any).avatar
        // Record this user so the member count stays accurate
        await upsertUser(
          (profile as any).id,
          (profile as any).username ?? (profile as any).global_name ?? "Unknown"
        ).catch(() => {}) // never block sign-in on storage errors
      }
      return token
    },
    session({ session, token }) {
      session.user.discordId = token.discordId as string
      session.user.image = token.avatar
        ? `https://cdn.discordapp.com/avatars/${token.discordId}/${token.avatar}.png`
        : session.user.image
      return session
    },
  },
})
