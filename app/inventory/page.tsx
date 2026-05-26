import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getInventory, fetchItemFloat, checkCanTrade, SteamSticker } from '@/lib/steam'
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


    if (user.steam_id) {
        const { allowed, reason } = await checkCanTrade(user.steam_id, user.steam_trade_url);
        if (!allowed) {
            return (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
                    <p className="text-xl font-medium">Trade restricted</p>
                    <p className="text-gray-400 text-sm max-w-sm">{reason ?? "Your Steam account cannot trade at this time."}</p>
                </div>
            );
        }
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
        rawInventory = cached.map(item => ({ ...item, tradable: true, price: 0, inspectLink: null, floatValue: null, paintSeed: null, stickers: null }));
    }

    // Fire-and-forget: fetch & cache float data for CS2 non-commodity items not yet cached.
    // Does not block page render — data appears on next inventory refresh.
    const floatCandidates = rawInventory.filter(i => i.game === 'CS2' && !i.commodity && i.inspectLink);
    if (floatCandidates.length > 0) {
        prisma.item_float.findMany({
            where: { assetId: { in: floatCandidates.map(i => i.assetId) } },
            select: { assetId: true },
        }).then(cached => {
            const cachedIds = new Set(cached.map(f => f.assetId));
            const toFetch = floatCandidates.filter(i => !cachedIds.has(i.assetId));
            return Promise.all(toFetch.map(async (item) => {
                const result = await fetchItemFloat(item.inspectLink!);
                if (!result) return;
                await prisma.item_float.upsert({
                    where: { assetId: item.assetId },
                    update: { floatValue: result.floatValue, paintSeed: result.paintSeed, stickers: result.stickers as any, fetchedAt: new Date() },
                    create: { assetId: item.assetId, floatValue: result.floatValue, paintSeed: result.paintSeed, stickers: result.stickers as any },
                });
            }));
        }).catch(() => {});
    }

    // Join float data
    const floatRows = await prisma.item_float.findMany({
        where: { assetId: { in: rawInventory.map(i => i.assetId) } },
    });
    const floatMap = new Map(floatRows.map(f => [f.assetId, f]));

    const names = rawInventory.map(i => i.market_name);
    const prices = await prisma.item.findMany({ where: { marketName: { in: names } } });
    const priceMap = new Map(prices.map(p => [p.marketName, p.price]));

    const listings = await prisma.item_listing.findMany({ where: { userId: user.id }, select: { assetId: true } });
    const listedAssetIds = new Set(listings.map(l => l.assetId));

    const inventoryWithPrices = rawInventory.map(item => {
        const f = floatMap.get(item.assetId);
        return {
            ...item,
            price: priceMap.get(item.market_name) ?? 0,
            floatValue: f?.floatValue ?? null,
            paintSeed: f?.paintSeed ?? null,
            stickers: (f?.stickers ?? null) as SteamSticker[] | null,
        };
    }).filter(item => !listedAssetIds.has(item.assetId));

    
    return <InventoryClient isSteamLinked={!!(user?.steam_id && user?.steam_trade_url)} inventory={inventoryWithPrices} lastRefresh={lastRefresh} />;
}

