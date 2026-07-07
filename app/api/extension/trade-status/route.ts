import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

//

// Reported by the extension once an item it's tracking has left the seller's own
// inventory — Steam removes an item from the sender's inventory the moment a trade is
// accepted, so this is a reliable acceptance signal that doesn't depend on the buyer's
// inventory (which Steam hides for recently-traded/trade-locked items). Starts the
// 7-day escrow hold; the final release/reversal check still goes through steamwebapi
// (see cron/process-purchases), since by then the trade-lock visibility restriction
// has lifted.
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orderId } = await req.json();

        if (typeof orderId !== "string") {
            return Response.json({ error: "Invalid request" }, { status: 400 });
        }

        const purchase = await prisma.purchase.findUnique({ where: { id: orderId } });

        if (!purchase || purchase.sellerId !== session.user.id) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.purchase.updateMany({
            where: { id: orderId, status: "pending" },
            data: { status: "holding", deliveredAt: new Date() },
        });

        return Response.json(null, { status: 200 });
    }
    catch (error) {
        console.error(error);

        return Response.json({ error: "Server error" }, { status: 500 });
    }
}
