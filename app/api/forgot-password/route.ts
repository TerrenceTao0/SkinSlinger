import { ForgotPasswordEmail } from "@/app/components/ForgotPasswordEmail";
import { Resend } from "resend"
import { prisma  } from "@/lib/db";

//

const resend = new Resend(process.env.RESEND_API);

//

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        const user = await prisma.user.findUnique({ where : {email} })

        if (!user) {
            return Response.json({ error: "Account not found" }, { status: 500 })
        }


        const token = crypto.randomUUID();
        const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

        await prisma.resetPassword.deleteMany({ where: { email } });
        
        await prisma.resetPassword.create({
            data: {
                email,
                token,
                expires
            },
        });


        const link = `http://localhost:3000/api/reset-password?token=${token}`

        const { error } = await resend.emails.send({
            from: 'Bifrost Markets <onboarding@resend.dev>',
            to: [email],
            subject: 'Reset Password',
            react: ForgotPasswordEmail({ link }),
        });


        if (error) {
            return Response.json({ error: error }, {status: 500})
        }


        return Response.json(null, { status: 200 })
    }
    catch (error) {
        console.log(error)

        return Response.json({ error: "Server error" }, { status: 500 })
    }
}

