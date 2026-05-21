import { prisma  } from "@/lib/db";

//

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token") ?? undefined;
        const pendingAccount = await prisma.pendingAccount.findUnique({ where: { token } })

        if (!pendingAccount) {
            return Response.redirect("http://localhost:3000/status?message=Token Invalid", 302)
        }


        if (pendingAccount.expires < new Date()) {
            return Response.redirect("http://localhost:3000/status?message=Link Expired", 302)
        }


        await prisma.user.create({
            data: {
                email: pendingAccount.email,
                password: pendingAccount.password,
                username: pendingAccount.username,
            },
        });


        await prisma.pendingAccount.delete({ where: { token } })

        return Response.redirect("http://localhost:3000/login", 302)
    } 
    catch (error) {
        console.error(error);

        return Response.json({ error: "Server error" }, { status: 500 });
    }
}

