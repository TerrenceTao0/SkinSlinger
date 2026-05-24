import { prisma } from "@/lib/db";

//

type InventoryResult = "has_item" | "no_item" | "private";

async function checkInventory(steamId: string, game: string | null, assetId: string): Promise<InventoryResult> {
    try {
        const appId = game ?? "730";
        const url = `https://steamcommunity.com/inventory/${steamId}/${appId}/2?l=english&count=5000`;
        const res = await fetch(url);
        if (!res.ok) return "private";
        const data = await res.json();
        if (data?.success !== 1) return "private";
        return data?.assets?.some((a: { assetid: string }) => a.assetid === assetId) ? "has_item" : "no_item";
    }
    catch {
        return "private";
    }
}

async function completePurchase(id: string, sellerId: string, price: number) {
    await prisma.$transaction(async (tx) => {
        const current = await tx.purchase.findUnique({ where: { id }, select: { status: true } });
        if (!current || current.status === "completed" || current.status === "cancelled") return;

        await tx.purchase.update({ where: { id }, data: { status: "completed" } });
        await tx.user.update({ where: { id: sellerId }, data: { cash: { increment: price } } });
    });
}

//

export async function GET(req: Request) {
    const secret = process.env.CRON_SECRET;
    if (secret) {
        const auth = req.headers.get("authorization");
        if (auth !== `Bearer ${secret}`) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        // Check buyer's Steam inventory for accepted trades
        const active = await prisma.purchase.findMany({
            where: {
                status: "offer_sent",
                buyer: { steam_id: { not: null } },
            },
            include: {
                buyer: { select: { steam_id: true } },
            },
        });

        let completed = 0;

        for (const p of active) {
            if (!p.buyer.steam_id) continue;
            const result = await checkInventory(p.buyer.steam_id, p.game, p.assetId);
            if (result === "has_item" || result === "private") {
                await completePurchase(p.id, p.sellerId, p.price);
                completed++;
            }
            // "no_item" → trade not yet accepted, do nothing
        }

        return Response.json({ completed });
    }
    catch (error) {
        console.error(error);
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}
