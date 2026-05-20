import { VerifyEmailTemplate } from "@/app/components/VerifyEmailTemplate";
import { Resend } from "resend"
import { prisma  } from "@/lib/db";

//

const resend = new Resend(process.env.RESEND_API);

//

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        const user = prisma.user.findUnique({ where : {email} })

        if (!user) {
            return Response.json({ error: "Account not found" }, { status: 500 })
        }

        
        return Response.json(null, { status: 200 })
    }
    catch (error) {
        console.log("Forgot password error: " + error)

        return Response.json({ error: "Server error" }, { status: 500 })
    }
}

