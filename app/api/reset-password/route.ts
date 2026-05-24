import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

//

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token") ?? undefined;
        const resetPassword = await prisma.resetPassword.findUnique({ where: { token } })

        if (!resetPassword) {
            return Response.redirect(`${process.env.NEXTAUTH_URL}/status?message=Server error`, 302)
        }


        return Response.redirect(`${process.env.NEXTAUTH_URL}/reset-password?token=${token}`, 302)
    }
    catch (error) {
        console.log(error);

        return Response.redirect(`${process.env.NEXTAUTH_URL}/status?message=Server error`, 302)
    }
}


export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();
        const resetPassword = await prisma.resetPassword.findUnique({ where: { token } })

        if (!resetPassword || !password) {
            return Response.json({error: "Invalid token"}, { status: 500 })
        }


        await prisma.resetPassword.deleteMany({ where: {token} });
        const hashed_password = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { email: resetPassword.email },
            data: {password: hashed_password }
        });


        return Response.json(null, { status: 200 })
    }
    catch (error) {
        console.log(error);

        return Response.json({error: "Server error"}, { status: 500 })
    }
}

