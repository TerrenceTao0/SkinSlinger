import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyInventoryToken } from "@/lib/inventoryToken";

//

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
            orderBy: { createdAt: "desc" },
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
        const marketNames = [...new Set(listings.map(l => l.marketName))];

        await prisma.item_listing.deleteMany({ where: { id: { in: idsToDelete } } });

        // Refund buy orders for market names that now have no listings
        const remaining = await prisma.item_listing.groupBy({
            by: ["marketName"],
            where: { marketName: { in: marketNames } },
        });
        const stillListed = new Set(remaining.map(r => r.marketName));
        const emptied = marketNames.filter(n => !stillListed.has(n));

        if (emptied.length > 0) {
            const orders = await prisma.buy_order.findMany({ where: { marketName: { in: emptied } } });
            if (orders.length > 0) {
                await prisma.$transaction([
                    prisma.buy_order.deleteMany({ where: { marketName: { in: emptied } } }),
                    ...orders.map(o => prisma.user.update({ where: { id: o.userId }, data: { cash: { increment: o.price * o.quantity } } })),
                ]);
            }
        }

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

        return Response.json(null, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}
