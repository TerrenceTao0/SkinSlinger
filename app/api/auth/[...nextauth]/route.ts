import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth" 
import Steam from 'next-auth-steam'
import type { NextRequest } from 'next/server'

//

async function auth(
  req: NextRequest,
  ctx: {
    params: {
      nextauth: string[]
    }
  }
) {
  return NextAuth(req, ctx, {
    ...authOptions,

    providers: [
        ...authOptions.providers,
        Steam(req, {
            clientSecret: process.env.STEAM_SECRET!
      })
    ]
  })
}

//

export { auth as GET, auth as POST }
