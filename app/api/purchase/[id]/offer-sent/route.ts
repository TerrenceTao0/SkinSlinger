import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

//

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const purchase = await prisma.purchase.findUnique({ where: { id } });

        if (!purchase) {
            return Response.json({ error: "Purchase not found" }, { status: 404 });
        }

        if (purchase.sellerId !== session.user.id) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        if (purchase.status !== "pending") {
            return Response.json({ error: "Purchase is not in pending state" }, { status: 409 });
        }

        await prisma.purchase.update({
            where: { id },
            data: { status: "offer_sent" },
        });

        return Response.json(null, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}
