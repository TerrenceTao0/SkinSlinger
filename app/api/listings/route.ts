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
        const search = searchParams.get("search");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const wear = searchParams.get("wear");

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
        const [inventoryItems, floatItems] = await Promise.all([
            prisma.inventory_item.findMany({ where: { assetId: { in: assetIds } } }),
            prisma.item_float.findMany({ where: { assetId: { in: assetIds } } }),
        ]);
        const itemMap = new Map(inventoryItems.map(i => [i.assetId, i]));
        const floatMap = new Map(floatItems.map(f => [f.assetId, f]));

        const listings = page
            .map(l => ({ ...l, inv: itemMap.get(l.assetId), float: floatMap.get(l.assetId) }))
            .filter(l => l.inv)
            .map(l => ({
                id: l.id,
                marketName: l.marketName,
                price: l.price,
                icon: l.inv!.icon,
                hexColor: l.inv!.hexColor,
                game: l.inv!.game,
                commodity: l.inv!.commodity,
                sellerId: l.userId,
                floatValue: l.float?.floatValue ?? null,
                paintSeed: l.float?.paintSeed ?? null,
                stickers: l.float?.stickers ?? null,
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

        return Response.json(null, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}
