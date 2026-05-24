import { VerifyEmail } from "@/app/components/VerifyEmail";
import { Resend } from "resend"
import { prisma  } from "@/lib/db";
import bcrypt from "bcryptjs";
import { containsSpecialChars } from "@/lib/utils";

//

const resend = new Resend(process.env.RESEND_API);

//

export async function POST(request: Request) {
    try {
        const { username, password, email } = await request.json();

        if (!username || username.length < 3) {
            return Response.json({error: "Username too short"}, { status: 400 });
        }


        if (!password || password.length < 5) {
            return Response.json({error: "Password too short"}, { status: 400 });
        }


        if (containsSpecialChars(username)) {
            return Response.json({error: "Username contains special characters"}, { status: 400 })
        }


        if (!email) {
            return Response.json({error: "Email required"}, { status: 400 });
        }


        const user = await prisma.user.findUnique({ where: { email } });

        if (user) {
            return Response.json({error: "Email is already in use"}, { status: 409 });
        }

        
        const user2 = await prisma.user.findUnique({ where: { username } });

        if (user2) {
            return Response.json({error: "Username is already in use"}, { status: 409 });
        }


        await prisma.pendingAccount.deleteMany({ where: {email} });

        const hashed_password = await bcrypt.hash(password, 10);
        const token = crypto.randomUUID();
        const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

        await prisma.pendingAccount.create({
            data: {
                email,
                username,
                password: hashed_password,
                token,
                expires
            },
        });


        const link = `http://localhost:3000/api/verify-email?token=${token}`

        const { error } = await resend.emails.send({
            from: 'SkinSlinger <onboarding@skinslinger.com>',
            to: [email],
            subject: 'Email Verification',
            react: VerifyEmail({ link }),
        });


        if (error) {
            return Response.json({ error }, { status: 500 });
        }


        return Response.json(null, { status: 200 });
    } 
    catch (error) {
        console.error(error);

        return Response.json({ error: "Server error" }, { status: 500 });
    }
}

