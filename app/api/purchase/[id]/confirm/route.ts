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

        if (purchase.buyerId !== session.user.id) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        if (purchase.status === "completed" || purchase.status === "cancelled") {
            return Response.json({ error: "Purchase already finalised" }, { status: 409 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.purchase.update({
                where: { id },
                data: { status: "completed" },
            });

            // Release payment to seller
            await tx.user.update({
                where: { id: purchase.sellerId },
                data: { cash: { increment: purchase.price } },
            });
        });

        return Response.json(null, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}
