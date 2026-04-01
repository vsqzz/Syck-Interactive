import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        token.discordId = (profile as any).id
        token.avatar = (profile as any).avatar
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
