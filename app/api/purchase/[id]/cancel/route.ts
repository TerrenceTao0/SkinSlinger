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
        const purchase = await prisma.purchase.findUnique({
            where: { id },
            include: { seller: { select: { email: true } } },
        });

        if (!purchase) {
            return Response.json({ error: "Purchase not found" }, { status: 404 });
        }

        // Only buyer can cancel, and only while pending or offer_sent
        if (purchase.buyerId !== session.user.id) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        if (purchase.status === "completed") {
            return Response.json({ error: "Purchase already completed" }, { status: 409 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.purchase.delete({ where: { id } });

            // Refund buyer
            await tx.user.update({
                where: { id: purchase.buyerId },
                data: { cash: { increment: purchase.price } },
            });

            // Restore listing
            await tx.item_listing.create({
                data: {
                    assetId: purchase.assetId,
                    marketName: purchase.marketName,
                    price: purchase.price,
                    game: purchase.game,
                    userId: purchase.sellerId,
                },
            });
        });

        return Response.json(null, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}
