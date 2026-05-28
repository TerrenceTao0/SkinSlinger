import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import { PurchaseNotificationEmail } from "@/app/components/PurchaseNotificationEmail";

//

const resend = new Resend(process.env.RESEND_API);

//

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const buyer = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!buyer) return Response.json({ error: "User not found" }, { status: 404 });

        const { marketName, price, quantity, game, icon, hexColor } = await request.json();

        if (!marketName || typeof price !== "number" || price <= 0) {
            return Response.json({ error: "Invalid price" }, { status: 400 });
        }
        if (!Number.isInteger(quantity) || quantity < 1) {
            return Response.json({ error: "Invalid quantity" }, { status: 400 });
        }

        const existingOrder = await prisma.buy_order.findFirst({
            where: { userId: buyer.id, marketName },
        });
        if (existingOrder) {
            return Response.json({ error: "You already have an active buy order for this item. Cancel it before placing a new one." }, { status: 409 });
        }

        const totalCost = price * quantity;

        if (buyer.cash < totalCost) {
            return Response.json({ error: "Insufficient balance" }, { status: 400 });
        }

        // Deduct full bid amount upfront
        const deducted = await prisma.user.updateMany({
            where: { id: buyer.id, cash: { gte: totalCost } },
            data: { cash: { decrement: totalCost } },
        });
        if (deducted.count === 0) {
            return Response.json({ error: "Insufficient balance" }, { status: 400 });
        }

        // Auto-match against existing sell orders (cheapest first, not own listings)
        const matchable = await prisma.item_listing.findMany({
            where: { marketName, price: { lte: price }, userId: { not: buyer.id } },
            orderBy: [{ price: "asc" }, { createdAt: "asc" }],
            take: quantity,
            include: {
                user: { select: { id: true, email: true } },
            },
        });

        let matched = 0;
        const sellerNotifications = new Map<string, { email: string | null; items: { marketName: string; price: number }[] }>();

        if (matchable.length > 0) {
            await prisma.$transaction(async (tx) => {
                for (const listing of matchable) {
                    await tx.purchase.create({
                        data: {
                            price: listing.price,
                            assetId: listing.assetId,
                            marketName: listing.marketName,
                            game: listing.game,
                            icon: listing.icon,
                            hexColor: listing.hexColor,
                            commodity: listing.commodity,
                            buyerTradeUrl: buyer.steam_trade_url,
                            buyerId: buyer.id,
                            sellerId: listing.userId,
                        },
                    });

                    // Refund the difference (buyer bid higher than sell price)
                    const diff = price - listing.price;
                    if (diff > 0.001) {
                        await tx.user.update({
                            where: { id: buyer.id },
                            data: { cash: { increment: diff } },
                        });
                    }

                    await tx.item_listing.delete({ where: { id: listing.id } });
                    matched++;

                    // Collect seller notification
                    const existing = sellerNotifications.get(listing.userId);
                    if (existing) {
                        existing.items.push({ marketName: listing.marketName, price: listing.price });
                    } else {
                        sellerNotifications.set(listing.userId, {
                            email: listing.user.email,
                            items: [{ marketName: listing.marketName, price: listing.price }],
                        });
                    }
                }
            });
        }

        // Create buy order for unmatched quantity
        const remaining = quantity - matched;
        if (remaining > 0) {
            await prisma.buy_order.create({
                data: {
                    userId: buyer.id,
                    marketName,
                    price,
                    quantity: remaining,
                    game: game ?? null,
                    icon: icon ?? null,
                    hexColor: hexColor ?? null,
                },
            });
        } else {
            // All matched — refund any leftover held balance for unmatched portion (already handled per-match above)
        }

        // If auto-match consumed all listings for this item, clean up any remaining buy orders
        if (matched > 0) {
            const listingsLeft = await prisma.item_listing.count({ where: { marketName } });
            if (listingsLeft === 0) {
                const orders = await prisma.buy_order.findMany({ where: { marketName } });
                if (orders.length > 0) {
                    await prisma.$transaction([
                        prisma.buy_order.deleteMany({ where: { marketName } }),
                        ...orders.map(o => prisma.user.update({ where: { id: o.userId }, data: { cash: { increment: o.price * o.quantity } } })),
                    ]);
                }
            }
        }

        // Notify sellers
        for (const [, seller] of sellerNotifications) {
            if (!seller.email) continue;
            await resend.emails.send({
                from: "SkinSlinger <onboarding@skinslinger.com>",
                to: [seller.email],
                subject: `New sale — send your item${seller.items.length > 1 ? "s" : ""}`,
                react: PurchaseNotificationEmail({
                    buyerTradeUrl: buyer.steam_trade_url ?? "",
                    buyerName: buyer.username ?? buyer.email ?? "Buyer",
                    items: seller.items,
                }),
            });
        }

        return Response.json({ matched, remaining });
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}
