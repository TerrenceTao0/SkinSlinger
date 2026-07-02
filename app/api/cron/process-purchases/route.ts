import { prisma } from "@/lib/db";
import { verifyBuyerHasItem } from "@/lib/steam";
import { sendTradeCompleteEmails, sendReversalRefundEmails, CompletedTrade, ReversedTrade } from "@/lib/tradeNotifications";

//

// Funds are held after delivery for the Steam trade-reversal window before being
// released to the seller, so a seller can't deliver, get paid, then reverse the trade.
const HOLD_MS = 7 * 24 * 60 * 60 * 1000;

//

// Releases held funds to the seller once the hold has elapsed and the item is still
// with the buyer. Returns true only on the real holding -> completed transition.
async function completePurchase(id: string, sellerId: string, price: number): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
        const updated = await tx.purchase.updateMany({ where: { id, status: "holding" }, data: { status: "completed" } });
        if (updated.count === 0) return false;
        await tx.user.update({ where: { id: sellerId }, data: { cash: { increment: price } } });
        return true;
    });
}

// Refunds the buyer when a delivered item disappears during the hold window (a Steam
// trade reversal). Returns true only on the real holding -> reversed transition.
async function refundReversal(id: string, buyerId: string, price: number): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
        const updated = await tx.purchase.updateMany({ where: { id, status: "holding" }, data: { status: "reversed" } });
        if (updated.count === 0) return false;
        await tx.user.update({ where: { id: buyerId }, data: { cash: { increment: price } } });
        return true;
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
        const active = await prisma.purchase.findMany({
            where: {
                status: { in: ["pending", "holding"] },
                buyer: { steam_id: { not: null } },
            },
            include: {
                buyer: { select: { steam_id: true, steam_trade_url: true, notificationEmail: true } },
                seller: { select: { notificationEmail: true } },
            },
        });

        // Float/pattern data is keyed by the seller's listing assetId (= purchase.assetId)
        // and is used to verify a skin precisely, since assetid itself changes on trade.
        const floatRows = await prisma.item_float.findMany({ where: { assetId: { in: active.map(p => p.assetId) } } });
        const floatMap = new Map(floatRows.map(f => [f.assetId, f]));

        const now = Date.now();
        const completedTrades: CompletedTrade[] = [];
        const reversedTrades: ReversedTrade[] = [];
        let delivered = 0;

        for (const p of active) {
            if (!p.buyer.steam_id) continue;

            // Holding orders only need checking once the hold has elapsed — no point polling
            // Steam during the window since the item is trade-locked and can't move.
            const matured = p.status === "holding" && p.deliveredAt != null && (now - p.deliveredAt.getTime()) >= HOLD_MS;
            if (p.status === "holding" && !matured) continue;

            const f = floatMap.get(p.assetId);
            const float = f ? { floatValue: f.floatValue, paintSeed: f.paintSeed } : null;
            const buyerTradeUrl = p.buyerTradeUrl ?? p.buyer.steam_trade_url;
            const result = await verifyBuyerHasItem(p.buyer.steam_id, p.game, p.marketName, float, buyerTradeUrl);

            console.log(`[process-purchases] id=${p.id} status=${p.status} game=${p.game} marketName=${p.marketName} hasFloat=${!!float} hasTradeUrl=${!!buyerTradeUrl} result=${result}`);

            if (result === "error") continue; // Steam unreachable — retry next run

            if (p.status === "pending") {
                // Awaiting delivery. has_item or private => delivered; start the hold.
                if (result === "has_item" || result === "private") {
                    const moved = await prisma.purchase.updateMany({
                        where: { id: p.id, status: "pending" },
                        data: { status: "holding", deliveredAt: new Date() },
                    });
                    if (moved.count > 0) delivered++;
                }
                // "no_item" => not delivered yet
            }
            else {
                // Holding and matured. Item still there (or hidden) => pay seller; gone => reversal.
                if (result === "has_item" || result === "private") {
                    const ok = await completePurchase(p.id, p.sellerId, p.price);
                    if (ok) completedTrades.push({
                        marketName: p.marketName, price: p.price,
                        buyerEmail: p.buyer.notificationEmail, sellerEmail: p.seller.notificationEmail,
                    });
                }
                else {
                    const ok = await refundReversal(p.id, p.buyerId, p.price);
                    if (ok) reversedTrades.push({
                        marketName: p.marketName, price: p.price, buyerEmail: p.buyer.notificationEmail,
                    });
                }
            }
        }

        await sendTradeCompleteEmails(completedTrades);
        await sendReversalRefundEmails(reversedTrades);

        return Response.json({ delivered, completed: completedTrades.length, reversed: reversedTrades.length });
    }
    catch (error) {
        console.error(error);

        return Response.json({ error: "Server error" }, { status: 500 });
    }
}
