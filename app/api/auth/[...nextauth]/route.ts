import NextAuth from "next-auth"
import Steam from 'next-auth-steam'
import type { NextRequest } from 'next/server'
import { authOptions } from "@/lib/auth"

//

async function auth(
  req: NextRequest,
  ctx: {
    params: Promise<{
      nextauth: string[]
    }>
  }
) {
  const params = await ctx.params;
  return NextAuth(req, { params }, {
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
