import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

//

const GAME_APP_IDS: Record<string, string> = {
    CS2: "730",
    Dota2: "570",
    Rust: "252490",
    TF2: "440",
}

async function checkInventory(steamId: string, game: string | null, assetId: string): Promise<"has_item" | "no_item" | "private"> {
    try {
        const appId = game ? (GAME_APP_IDS[game] ?? "730") : "730";
        const rawAssetId = assetId.includes(":") ? assetId.split(":")[1] : assetId;
        const res = await fetch(`https://steamcommunity.com/inventory/${steamId}/${appId}/2?l=english&count=5000`);
        if (!res.ok) return "private";
        const data = await res.json();
        if (data?.success !== 1) return "private";
        return data?.assets?.some((a: { assetid: string }) => a.assetid === rawAssetId) ? "has_item" : "no_item";
    } catch {
        return "private";
    }
}

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
            include: {
                buyer: { select: { steam_id: true } },
            },
        });


        if (!purchase) {
            return Response.json({ error: "Purchase not found" }, { status: 404 });
        }


        // Only buyer or seller can cancel
        if (purchase.buyerId !== session.user.id && purchase.sellerId !== session.user.id) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }


        if (purchase.status === "completed") {
            return Response.json({ error: "Purchase already completed" }, { status: 409 });
        }


        // Check the buyer's inventory before cancelling to prevent scamming
        if (purchase.buyer.steam_id) {
            const result = await checkInventory(purchase.buyer.steam_id, purchase.game, purchase.assetId);
            if (result === "has_item") {
                // Buyer already received the item — complete instead of cancel
                await prisma.$transaction(async (tx) => {
                    await tx.purchase.update({ where: { id }, data: { status: "completed" } });
                    await tx.user.update({ where: { id: purchase.sellerId }, data: { cash: { increment: purchase.price } } });
                });


                return Response.json({ error: "Trade already completed — the buyer has the item. The seller has been paid." }, { status: 409 });
            }
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
