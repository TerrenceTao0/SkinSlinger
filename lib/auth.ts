import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./db"
import { compare } from "bcryptjs";
import { Resend } from "resend";
import { TwoFactorEmail } from "@/app/components/TwoFactorEmail";

//

const resend = new Resend(process.env.RESEND_API);

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
                    select: { cash: true, steam_trade_url: true, lastInventoryRefresh: true, steam_id: true },
                });

                
                if (dbUser) {
                    token.cash = dbUser.cash;
                    token.steam_id = dbUser.steam_id ?? undefined;
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
            credentials: {
                user: { label: "Username/Email", type: "text" },
                password: { label: "Password", type: "password" },
                code: { label: "Code", type: "text" },
                autoLoginToken: { label: "Auto Login Token", type: "text" },
            },

            async authorize(credentials) {
                // Auto-login after email verification
                if (credentials?.autoLoginToken && credentials?.user) {
                    const entry = await prisma.verificationToken.findUnique({
                        where: { identifier_token: { identifier: credentials.user, token: credentials.autoLoginToken } }
                    });
                    if (!entry || entry.expires < new Date()) return null;
                    await prisma.verificationToken.delete({
                        where: { identifier_token: { identifier: credentials.user, token: credentials.autoLoginToken } }
                    });
                    const user = await prisma.user.findUnique({ where: { email: credentials.user } });
                    if (!user) return null;
                    return { id: user.id, email: user.email ?? undefined, username: user.username ?? undefined, cash: user.cash };
                }

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
                });


                if (!foundUser || !foundUser.password) {
                    return null;
                }


                const passwordMatches = await compare(credentials.password, foundUser.password);

                if (!passwordMatches) {
                    return null;
                }


                if (credentials.code) {
                    if (!foundUser.twoFactorCode || !foundUser.twoFactorExpires) {
                        throw new Error("2FA_REQUIRED");
                    }


                    if (foundUser.twoFactorExpires < new Date()) {
                        throw new Error("2FA_EXPIRED");
                    }


                    if (foundUser.twoFactorCode !== credentials.code.trim()) {
                        throw new Error("2FA_INVALID");
                    }


                    await prisma.user.update({
                        where: { id: foundUser.id },
                        data: { twoFactorCode: null, twoFactorExpires: null },
                    });
                } 
                else {
                    const code = Math.floor(100000 + Math.random() * 900000).toString();
                    const expires = new Date(Date.now() + 10 * 60 * 1000);

                    await prisma.user.update({
                        where: { id: foundUser.id },
                        data: { twoFactorCode: code, twoFactorExpires: expires },
                    });


                    await resend.emails.send({
                        from: 'SkinSlinger <onboarding@skinslinger.com>',
                        to: [foundUser.email!],
                        subject: 'Login Code',
                        react: TwoFactorEmail({ code }),
                    });


                    throw new Error("2FA_REQUIRED");
                }

                
                return {
                    id: foundUser.id,
                    username: foundUser.username ?? undefined,
                    email: foundUser.email ?? undefined,
                    cash: foundUser.cash,
                };
            }
        })
    ]
}

