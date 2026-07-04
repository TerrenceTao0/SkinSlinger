import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyInventoryToken } from "@/lib/inventoryToken";
import { Resend } from "resend";
import { PurchaseNotificationEmail } from "@/app/components/PurchaseNotificationEmail";
import { countInventoryItem } from "@/lib/steam";

//

const resend = new Resend(process.env.RESEND_API);

const PAGE_SIZE = 30;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const cursor = searchParams.get("cursor");
        const game = searchParams.get("game");
        const search = searchParams.get("search");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const wear = searchParams.get("wear");
        const minFloat = searchParams.get("minFloat");
        const maxFloat = searchParams.get("maxFloat");

        // If float range specified, pre-fetch matching assetIds from item_float
        let floatAssetIds: string[] | null = null;
        if (minFloat || maxFloat) {
            const floatMatches = await prisma.item_float.findMany({
                where: {
                    ...(minFloat ? { floatValue: { gte: parseFloat(minFloat) } } : {}),
                    ...(maxFloat ? { floatValue: { lte: parseFloat(maxFloat) } } : {}),
                },
                select: { assetId: true },
            });
            floatAssetIds = floatMatches.map(f => f.assetId);
        }

        const andFilters: object[] = [];
        if (search) andFilters.push({ marketName: { contains: search, mode: 'insensitive' as const } });
        if (wear) andFilters.push({ marketName: { contains: `(${wear})`, mode: 'insensitive' as const } });

        const where = {
            ...(game ? { game } : {}),
            ...(andFilters.length > 0 ? { AND: andFilters } : {}),
            ...((minPrice || maxPrice) ? { price: {
                ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
                ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
            }} : {}),
            ...(floatAssetIds !== null ? { assetId: { in: floatAssetIds } } : {}),
        };

        const rows = await prisma.item_listing.findMany({
            take: PAGE_SIZE + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            where,
            // Must match the initial server render in market/[game]/page.tsx — the
            // client feeds the last id of that page in as the cursor here.
            orderBy: [{ price: "desc" }, { id: "asc" }],
        });

        const page = rows.slice(0, PAGE_SIZE);
        const nextCursor = rows.length > PAGE_SIZE ? page[page.length - 1].id : null;

        const assetIds = page.map(l => l.assetId);
        const floatItems = await prisma.item_float.findMany({ where: { assetId: { in: assetIds } } });
        const floatMap = new Map(floatItems.map(f => [f.assetId, f]));

        const listings = page
            .filter(l => l.icon)
            .map(l => ({
                id: l.id,
                marketName: l.marketName,
                price: l.price,
                icon: l.icon!,
                hexColor: l.hexColor!,
                game: l.game ?? '',
                commodity: l.commodity,
                sellerId: l.userId,
                floatValue: floatMap.get(l.assetId)?.floatValue ?? null,
                paintSeed: floatMap.get(l.assetId)?.paintSeed ?? null,
                stickers: floatMap.get(l.assetId)?.stickers ?? null,
            }));

        return Response.json({ listings, nextCursor });
    }
    catch (error) {
        console.error(error);
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const { ids } = await request.json();
        if (!Array.isArray(ids) || ids.length === 0) return Response.json({ error: "No ids provided" }, { status: 400 });

        const listings = await prisma.item_listing.findMany({
            where: { id: { in: ids }, userId: session.user.id },
            select: { id: true, marketName: true },
        });

        if (listings.length === 0) return Response.json(null, { status: 200 });

        const idsToDelete = listings.map(l => l.id);

        await prisma.item_listing.deleteMany({ where: { id: { in: idsToDelete } } });

        return Response.json(null, { status: 200 });
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });

        if (!user) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }

        const { items, inventoryToken } = await request.json();

        if (!Array.isArray(items) || items.length === 0) {
            return Response.json({ error: "No items provided" }, { status: 400 });
        }

        // Verify inventory ownership token
        const tokenItems = await verifyInventoryToken(inventoryToken, user.id);
        if (!tokenItems) {
            return Response.json({ error: "Inventory session expired. Please refresh the page." }, { status: 401 });
        }

        // Build lookup structures from token
        const tokenAssetIds = new Set(tokenItems.map(i => i.assetId));
        const tokenByMarketName = new Map<string, string[]>();
        for (const ti of tokenItems) {
            const existing = tokenByMarketName.get(ti.marketName);
            if (existing) existing.push(ti.assetId);
            else tokenByMarketName.set(ti.marketName, [ti.assetId]);
        }

        // Track assetIds already listed to avoid duplicates
        const existingListings = await prisma.item_listing.findMany({
            where: { userId: user.id },
            select: { assetId: true },
        });
        const listedAssetIds = new Set(existingListings.map(l => l.assetId));

        type ListingInput = { assetId: string, marketName: string, price: number, game: string, commodity: boolean, quantity: number, icon: string, hexColor: string };

        const toCreate: { userId: string, assetId: string, marketName: string, price: number, game: string, icon: string, hexColor: string, commodity: boolean }[] = [];

        for (const item of items as ListingInput[]) {
            if (item.commodity) {
                const availableAssetIds = (tokenByMarketName.get(item.marketName) ?? [])
                    .filter(assetId => !listedAssetIds.has(assetId));

                const take = Math.min(item.quantity, availableAssetIds.length);
                for (let i = 0; i < take; i++) {
                    const assetId = availableAssetIds[i];
                    toCreate.push({ userId: user.id, assetId, marketName: item.marketName, price: item.price, game: item.game, icon: item.icon, hexColor: item.hexColor, commodity: true });
                    listedAssetIds.add(assetId);
                }
            } else {
                if (!tokenAssetIds.has(item.assetId) || listedAssetIds.has(item.assetId)) continue;

                toCreate.push({ userId: user.id, assetId: item.assetId, marketName: item.marketName, price: item.price, game: item.game, icon: item.icon, hexColor: item.hexColor, commodity: false });
                listedAssetIds.add(item.assetId);
            }
        }

        if (toCreate.length > 0) {
            await prisma.item_listing.createMany({ data: toCreate, skipDuplicates: true });
        }

        // Fill standing buy orders with the freshly listed items (order-book matching).
        // Each listing matches the best bid (highest price, then oldest) from a deliverable
        // buyer; the trade clears at the listed price and the buyer is refunded the difference.
        const matchedSales: { buyerTradeUrl: string; marketName: string; price: number }[] = [];

        for (const listed of toCreate) {
            const sale = await prisma.$transaction(async (tx) => {
                const live = await tx.item_listing.findUnique({ where: { assetId: listed.assetId } });
                if (!live || live.userId !== user.id) return null;

                const order = await tx.buy_order.findFirst({
                    where: {
                        marketName: live.marketName,
                        price: { gte: live.price },
                        quantity: { gt: 0 },
                        userId: { not: user.id },
                        user: { steam_id: { not: null }, steam_trade_url: { not: null } },
                    },
                    orderBy: [{ price: "desc" }, { createdAt: "asc" }],
                    include: { user: { select: { steam_id: true, steam_trade_url: true } } },
                });
                if (!order) return null;

                // Consume the listing; bail (rolls back) if it was bought concurrently.
                const delListing = await tx.item_listing.deleteMany({ where: { id: live.id } });
                if (delListing.count === 0) return null;

                // Consume one unit of the buy order; if it raced to zero, roll the whole match back.
                const consumed = await tx.buy_order.updateMany({
                    where: { id: order.id, quantity: { gt: 0 } },
                    data: { quantity: { decrement: 1 } },
                });
                if (consumed.count === 0) throw new Error("buy order race");
                await tx.buy_order.deleteMany({ where: { id: order.id, quantity: { lte: 0 } } });

                // Snapshot how many of this commodity the buyer already holds, so the cron can
                // prove delivery by a count increase rather than mere presence (see verifyBuyerHasItem).
                const buyerPreCount = live.commodity && order.user.steam_id
                    ? await countInventoryItem(order.user.steam_id, live.game, live.marketName)
                    : null;

                await tx.purchase.create({
                    data: {
                        price: live.price,
                        assetId: live.assetId,
                        marketName: live.marketName,
                        game: live.game,
                        icon: live.icon,
                        hexColor: live.hexColor,
                        commodity: live.commodity,
                        buyerTradeUrl: order.user.steam_trade_url,
                        buyerPreCount,
                        buyerId: order.userId,
                        sellerId: user.id,
                    },
                });

                // The buyer held their bid; the trade clears at the listed (lower-or-equal) price.
                const diff = order.price - live.price;
                if (diff > 0.001) {
                    await tx.user.update({ where: { id: order.userId }, data: { cash: { increment: diff } } });
                }

                return { buyerTradeUrl: order.user.steam_trade_url!, marketName: live.marketName, price: live.price };
            }).catch(() => null);

            if (sale) matchedSales.push(sale);
        }

        // Notify the seller to send any instantly-sold items, grouped by buyer trade URL.
        const notifyTo = user.notificationEmail;
        if (matchedSales.length > 0 && notifyTo) {
            const byBuyer = new Map<string, { marketName: string; price: number }[]>();
            for (const s of matchedSales) {
                const items = byBuyer.get(s.buyerTradeUrl) ?? [];
                items.push({ marketName: s.marketName, price: s.price });
                byBuyer.set(s.buyerTradeUrl, items);
            }
            for (const [buyerTradeUrl, items] of byBuyer) {
                await resend.emails.send({
                    from: "SkinSlinger <onboarding@skinslinger.com>",
                    to: [notifyTo],
                    subject: `New sale — send your item${items.length > 1 ? "s" : ""}`,
                    react: PurchaseNotificationEmail({ buyerTradeUrl, buyerName: "Buyer", items }),
                });
            }
        }

        return Response.json(null, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}
