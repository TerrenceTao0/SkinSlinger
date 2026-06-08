import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./db"

//

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    secret: process.env.NEXTAUTH_SECRET,

    session: {
        strategy: 'jwt'
    },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.steam_id = user.steam_id
            }

            // Fallback: if token.id was never set, look up by email
            if (!token.id && token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email },
                    select: { id: true, cash: true, steam_trade_url: true, steam_id: true },
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.cash = dbUser.cash;
                    token.steam_id = dbUser.steam_id ?? undefined;
                    token.steam_trade_url = dbUser.steam_trade_url ?? undefined;
                }
                return token;
            }

            if (token.id) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { cash: true, steam_trade_url: true, steam_id: true },
                });

                if (dbUser) {
                    token.cash = dbUser.cash;
                    token.steam_id = dbUser.steam_id ?? undefined;
                    token.steam_trade_url = dbUser.steam_trade_url ?? undefined;
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id
                session.user.steam_id = token.steam_id
                session.user.steam_trade_url = token.steam_trade_url
                session.user.cash = token.cash
            }

            return session;
        }
    },

    providers: []
}
