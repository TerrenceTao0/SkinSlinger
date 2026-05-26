import { prisma } from "@/lib/db";
import HomeClient from "../components/HomeClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Metadata } from 'next'

//

export const metadata: Metadata = {
    title: 'Steam Skin Marketplace',
    description: 'Browse CS2, Dota 2, Rust, and TF2 skins listed by real players. 0% sales fee, no KYC, no trade hold.',
    openGraph: {
        title: 'SkinSlinger — Steam Skin Marketplace',
        description: 'Browse CS2, Dota 2, Rust, and TF2 skins listed by real players. 0% sales fee, no KYC, no trade hold.',
        url: '/market',
    },
}

//

const PAGE_SIZE = 30;

//

export default async function App() {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id ?? null;

    const hasPendingPurchase = currentUserId ? (await prisma.purchase.count({
        where: { buyerId: currentUserId, status: "pending" },
    })) > 0 : false;

    const rows = await prisma.item_listing.findMany({
        take: PAGE_SIZE + 1,
        orderBy: { price: "desc" },
    });


    const page = rows.slice(0, PAGE_SIZE);
    const hasMore = rows.length > PAGE_SIZE;

    const assetIds = page.map(listing => listing.assetId);
    const [inventoryItems, floatItems] = await Promise.all([
        prisma.inventory_item.findMany({ where: { assetId: { in: assetIds } } }),
        prisma.item_float.findMany({ where: { assetId: { in: assetIds } } }),
    ]);
    const itemMap = new Map(inventoryItems.map(item => [item.assetId, item]));
    const floatMap = new Map(floatItems.map(item => [item.assetId, item]));

    const cards = page
        .map(listing => ({ ...listing, inv: itemMap.get(listing.assetId), float: floatMap.get(listing.assetId) }))
        .filter(listing => listing.inv)
        .map(listing => ({
            id: listing.id,
            marketName: listing.marketName,
            price: listing.price,
            icon: listing.inv!.icon,
            hexColor: listing.inv!.hexColor,
            game: listing.inv!.game,
            commodity: listing.inv!.commodity,
            sellerId: listing.userId,
            floatValue: listing.float?.floatValue ?? null,
            paintSeed: listing.float?.paintSeed ?? null,
            stickers: (listing.float?.stickers ?? null) as { stickerId: number; slot: number; name: string; image: string; wear: number | null }[] | null,
        }));


    return <HomeClient initialListings={cards} initialHasMore={hasMore} currentUserId={currentUserId} hasPendingPurchase={hasPendingPurchase} />;
}
