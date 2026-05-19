import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./db"
import { compare } from "bcrypt";

//

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),

    pages: {
        signIn: '/login'
    },

    providers: [
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
                        { name: credentials.user },
                    ]
                }
            })

            if (!foundUser) {
                return null;
            }


            const passwordMatches = await compare(credentials.password, foundUser.password);

            if (!passwordMatches) {
                return null;
            } 


            return {
                id: foundUser.id,
                name: foundUser.name,
                email: foundUser.email
            }
        }
    })
    ]
}

