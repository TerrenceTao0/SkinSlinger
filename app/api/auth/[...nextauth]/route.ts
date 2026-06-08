import NextAuth from "next-auth"
import Steam from 'next-auth-steam'
import type { NextRequest } from 'next/server'

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
    providers: [
      Steam(req, {
        clientSecret: process.env.STEAM_SECRET!
      })
    ]
  })
}

//

export { auth as GET, auth as POST }
