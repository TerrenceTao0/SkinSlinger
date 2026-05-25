import { prisma  } from "@/lib/db";

//

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token") ?? undefined;
        const pendingAccount = await prisma.pendingAccount.findUnique({ where: { token } })

        if (!pendingAccount) {
            return Response.redirect(`${process.env.NEXTAUTH_URL}/status?message=Token Invalid`, 302)
        }


        if (pendingAccount.expires < new Date()) {
            return Response.redirect(`${process.env.NEXTAUTH_URL}/status?message=Link Expired`, 302)
        }


        await prisma.user.create({
            data: {
                email: pendingAccount.email,
                password: pendingAccount.password,
                username: pendingAccount.username,
                emailVerified: new Date(),
            },
        });

        await prisma.pendingAccount.delete({ where: { token } });

        const autoLoginToken = crypto.randomUUID();
        await prisma.verificationToken.create({
            data: {
                identifier: pendingAccount.email,
                token: autoLoginToken,
                expires: new Date(Date.now() + 5 * 60 * 1000),
            },
        });

        const dest = `${process.env.NEXTAUTH_URL}/verify-success?token=${autoLoginToken}&email=${encodeURIComponent(pendingAccount.email)}`;
        return Response.redirect(dest, 302)
    } 
    catch (error) {
        console.error(error);

        return Response.json({ error: "Server error" }, { status: 500 });
    }
}

