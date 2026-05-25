import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getInventory } from '@/lib/steam'
import { SteamItem } from "@/lib/steam";
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'My Inventory',
    robots: { index: false, follow: false },
}

import InventoryClient from "./InventoryClient";

//

export default async function Inventory() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/login");
    }


    const user = await prisma.user.findUnique({ where: { email: session.user!.email! } });

    if (!user) {
        redirect("/login");
    }


    const now = new Date();
    const stale = now.getTime() - user.lastInventoryRefresh.getTime() > 60 * 1000;

    let rawInventory: SteamItem[];
    let lastRefresh = user.lastInventoryRefresh;

    if (stale && user && user.steam_id) {
        const fetched = await getInventory(user.steam_id);
        rawInventory = [...new Map(fetched.map(i => [i.assetId, i])).values()];

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: user.id },
                data: { inventory_item: { deleteMany: {} } }
            });

            
            await tx.user.update({
                where: { id: user.id },
                data: {
                    lastInventoryRefresh: now,
                    inventory_item: {
                        createMany: {
                            data: rawInventory.map(item => ({
                                assetId: item.assetId,
                                market_name: item.market_name,
                                market_hash_name: item.market_hash_name,
                                icon: item.icon,
                                type: item.type,
                                hexColor: item.hexColor,
                                game: item.game,
                                commodity: item.commodity,
                            })),
                            skipDuplicates: true,
                        }
                    }
                }
            });
        });
        lastRefresh = now;
    }
    else {
        const cached = await prisma.inventory_item.findMany({ where: { userId: user.id } });
        rawInventory = cached.map(item => ({ ...item, tradable: true, price: 0 }));
    }


    const names = rawInventory.map(i => i.market_name);
    const prices = await prisma.item.findMany({ where: { marketName: { in: names } } });
    const priceMap = new Map(prices.map(p => [p.marketName, p.price]));

    const listings = await prisma.item_listing.findMany({ where: { userId: user.id }, select: { assetId: true } });
    const listedAssetIds = new Set(listings.map(l => l.assetId));

    const inventoryWithPrices = rawInventory.map(item => ({
        ...item,
        price: priceMap.get(item.market_name) ?? 0
    })).filter(item => !listedAssetIds.has(item.assetId));

    
    return <InventoryClient isSteamLinked={!!(user?.steam_id && user?.steam_trade_url)} inventory={inventoryWithPrices} lastRefresh={lastRefresh} />;
}

