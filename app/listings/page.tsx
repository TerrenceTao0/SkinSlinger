import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import ListingsClient from "./ListingsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "My Listings",
    robots: { index: false, follow: false },
};

//

export default async function ListingsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) redirect("/login");

    const activePurchases = await prisma.purchase.findMany({
        where: { sellerId: session.user.id, status: "pending" },
        select: { assetId: true },
    });
    const lockedAssetIds = new Set(activePurchases.map(p => p.assetId));

    const rows = await prisma.item_listing.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    const listings = rows
        .map(l => {
            if (lockedAssetIds.has(l.assetId)) return null;
            return {
                id: l.id,
                assetId: l.assetId,
                marketName: l.marketName,
                price: l.price,
                game: l.game,
                icon: l.icon,
                hexColor: l.hexColor,
                commodity: l.commodity,
            };
        })
        .filter((l): l is NonNullable<typeof l> => l !== null);

    return <ListingsClient listings={listings} />;
}
