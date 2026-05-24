import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

//

const PAGE_SIZE = 30;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const cursor = searchParams.get("cursor");
        const game = searchParams.get("game");

        const where = game ? { game } : {};

        const rows = await prisma.item_listing.findMany({
            take: PAGE_SIZE + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            where,
            orderBy: { createdAt: "desc" },
        });

        const page = rows.slice(0, PAGE_SIZE);
        const nextCursor = rows.length > PAGE_SIZE ? page[page.length - 1].id : null;

        const assetIds = page.map(l => l.assetId);
        const inventoryItems = await prisma.inventory_item.findMany({ where: { assetId: { in: assetIds } } });
        const itemMap = new Map(inventoryItems.map(i => [i.assetId, i]));

        const marketNames = page.map(l => l.marketName);
        const marketItems = await prisma.item.findMany({ where: { marketName: { in: marketNames } } });
        const marketPriceMap = new Map(marketItems.map(i => [i.marketName, i.price]));

        const listings = page
            .map(l => ({ ...l, inv: itemMap.get(l.assetId) }))
            .filter(l => l.inv)
            .map(l => ({
                id: l.id,
                marketName: l.marketName,
                price: l.price,
                marketPrice: marketPriceMap.get(l.marketName) ?? null,
                icon: l.inv!.icon,
                hexColor: l.inv!.hexColor,
                game: l.inv!.game,
                commodity: l.inv!.commodity,
                sellerId: l.userId,
            }));

        return Response.json({ listings, nextCursor });
    }
    catch (error) {
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

        const { items } = await request.json();

        if (!Array.isArray(items) || items.length === 0) {
            return Response.json({ error: "No items provided" }, { status: 400 });
        }

        // Track assetIds already listed to avoid duplicates within this request
        const existingListings = await prisma.item_listing.findMany({
            where: { userId: user.id },
            select: { assetId: true },
        });
        const listedAssetIds = new Set(existingListings.map(l => l.assetId));

        type ListingInput = { assetId: string, marketName: string, price: number, game: string, commodity: boolean, quantity: number };

        const toCreate: { userId: string, assetId: string, marketName: string, price: number, game: string }[] = [];

        for (const item of items as ListingInput[]) {
            if (item.commodity) {
                const invItems = await prisma.inventory_item.findMany({
                    where: {
                        userId: user.id,
                        market_name: item.marketName,
                        assetId: { notIn: [...listedAssetIds] },
                    },
                    take: item.quantity,
                });

                for (const inv of invItems) {
                    toCreate.push({ userId: user.id, assetId: inv.assetId, marketName: item.marketName, price: item.price, game: item.game });
                    listedAssetIds.add(inv.assetId);
                }
            } else {
                const inv = await prisma.inventory_item.findFirst({
                    where: { assetId: item.assetId, userId: user.id },
                });

                if (!inv || listedAssetIds.has(item.assetId)) continue;

                toCreate.push({ userId: user.id, assetId: item.assetId, marketName: item.marketName, price: item.price, game: item.game });
                listedAssetIds.add(item.assetId);
            }
        }

        await prisma.item_listing.createMany({ data: toCreate, skipDuplicates: true });

        await prisma.user.update({
            where: { id: user.id },
            data: { lastInventoryRefresh: new Date(0) },
        });

        return Response.json(null, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}
