import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./db"
import { compare } from "bcryptjs";

//

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    secret: process.env.NEXTAUTH_SECRET,

    session: {
        strategy: 'jwt'
    },

    pages: {
        signIn: '/login',
    },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.steam_id = user.steam_id
            }


            if (token.id) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { cash: true, steam_trade_url: true, lastInventoryRefresh: true },
                });

                
                if (dbUser) {
                    token.cash = dbUser.cash;
                    token.steam_trade_url = dbUser.steam_trade_url ?? undefined;
                    token.lastInventoryRefresh = dbUser.lastInventoryRefresh ?? undefined;
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
            session.user.lastInventoryRefresh = token.lastInventoryRefresh
          }


          return session;
      }
  },

    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_ID!,
            clientSecret: process.env.GOOGLE_SECRET!,
            allowDangerousEmailAccountLinking: true,
        }),

        CredentialsProvider({
            name: "Credentials",
            credentials: 
            {
                user: { 
                    label: "Username/Email", 
                    type: "text" 
                },

                password: { 
                    label: "Password", 
                    type: "password"
                }
            },

            async authorize(credentials) {
                if (!credentials?.user || !credentials?.password) {
                    return null;
                }


                const foundUser = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: credentials.user },
                            { username: credentials.user },
                        ]
                    }
                })


                if (!foundUser || !foundUser?.password) {
                    return null;
                }


                const passwordMatches = await compare(credentials.password, foundUser.password);

                if (!passwordMatches) {
                    return null;
                } 


                return {
                    id: foundUser.id,
                    username: foundUser.username,
                    email: foundUser.email,
                    cash: foundUser.cash,
                }
            }
        })
    ]
}

