import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import type { Metadata } from "next";
import ItemPageClient from "./ItemPageClient";

//

const GAME_NAMES: Record<string, string> = {
    CS2:   "Counter-Strike 2",
    Dota2: "Dota 2",
    Rust:  "Rust",
    TF2:   "Team Fortress 2",
};

const GAME_SLUGS: Record<string, string> = {
    CS2:   "cs2",
    Dota2: "dota2",
    Rust:  "rust",
    TF2:   "tf2",
};

//

const getItem = cache(async (slug: string) => {
    // Reverse the slug to find the marketName via PostgreSQL
    const rows = await prisma.$queryRaw<{ marketName: string }[]>`
        SELECT "marketName" FROM item_listing
        WHERE REGEXP_REPLACE(LOWER("marketName"), '[^a-z0-9]+', '-', 'g') = ${slug}
        LIMIT 1
    `;
    if (!rows.length) return null;

    const { marketName } = rows[0];

    const [listings, listingMeta] = await Promise.all([
        prisma.item_listing.findMany({
            where: { marketName },
            select: { id: true, price: true },
            orderBy: { price: "asc" },
        }),
        prisma.item_listing.findFirst({
            where: { marketName },
            select: { icon: true, hexColor: true, game: true },
        }),
    ]);

    if (!listings.length || !listingMeta?.icon || !listingMeta?.hexColor || !listingMeta?.game) return null;
    const inv = { icon: listingMeta.icon, hexColor: listingMeta.hexColor, game: listingMeta.game };
    return { marketName, listings, inv };
});

//

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const data = await getItem(slug);
    if (!data) return {};

    const { marketName, inv } = data;
    const gameName = GAME_NAMES[inv.game] ?? inv.game;
    const title = `${marketName} - ${gameName} - SkinSlinger`;
    const description = `Buy ${marketName}. No KYC, 0% sales fee, pay with crypto. Your ${gameName} skin marketplace.`;

    return {
        title,
        description,
        alternates: { canonical: `/item/${slug}` },
        openGraph: {
            title,
            description,
            url: `/item/${slug}`,
            images: [{ url: inv.icon, alt: marketName }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [inv.icon],
        },
    };
}

//

export default async function ItemTypePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const data = await getItem(slug);
    if (!data) notFound();

    const { marketName, listings, inv } = data;
    const gameName = GAME_NAMES[inv.game] ?? inv.game;
    const gameSlug = GAME_SLUGS[inv.game] ?? "cs2";

    const prices = listings.map(l => l.price);
    const lowPrice = Math.min(...prices);
    const highPrice = Math.max(...prices);

    const base = process.env.NEXTAUTH_URL ?? '';

    const jsonLd = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": `${marketName} - ${gameName}`,
        "url": `${base}/item/${slug}`,
        "image": inv.icon,
        "description": `Buy ${marketName}. No KYC, 0% sales fee, pay with crypto. Your ${gameName} skin marketplace.`,
        "offers": {
            "@type": "AggregateOffer",
            "lowPrice": lowPrice.toFixed(2),
            "highPrice": highPrice.toFixed(2),
            "offerCount": listings.length,
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock",
            "seller": { "@type": "Organization", "name": "SkinSlinger", "url": base },
        },
    };

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": `${base}/` },
            { "@type": "ListItem", "position": 2, "name": gameName, "item": `${base}/market/${gameSlug}` },
            { "@type": "ListItem", "position": 3, "name": marketName, "item": `${base}/item/${slug}` },
        ],
    };

    // Fetch order book data and user info in parallel
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

    const [buyOrders, myBuyOrders, pendingCount] = await Promise.all([
        prisma.buy_order.findMany({
            where: { marketName },
            orderBy: { price: "desc" },
            select: { price: true, quantity: true },
        }),
        userId ? prisma.buy_order.findMany({
            where: { marketName, userId },
            orderBy: { createdAt: "desc" },
            select: { id: true, price: true, quantity: true },
        }) : Promise.resolve([]),
        userId ? prisma.purchase.count({ where: { buyerId: userId, status: "pending" } }) : Promise.resolve(0),
    ]);

    // Aggregate sell orders by price level
    const sellMap = new Map<number, number>();
    for (const l of listings) {
        sellMap.set(l.price, (sellMap.get(l.price) ?? 0) + 1);
    }
    const sellOrders = [...sellMap.entries()]
        .map(([price, quantity]) => ({ price, quantity }))
        .sort((a, b) => a.price - b.price);

    // Aggregate buy orders by price level
    const buyMap = new Map<number, number>();
    for (const o of buyOrders) {
        buyMap.set(o.price, (buyMap.get(o.price) ?? 0) + o.quantity);
    }
    const buyOrderLevels = [...buyMap.entries()]
        .map(([price, quantity]) => ({ price, quantity }))
        .sort((a, b) => b.price - a.price);

    return (
        <>
            <ItemPageClient
                marketName={marketName}
                icon={inv.icon}
                hexColor={inv.hexColor}
                game={inv.game}
                gameSlug={gameSlug}
                initialSellOrders={sellOrders}
                initialBuyOrders={buyOrderLevels}
                initialMyBuyOrders={myBuyOrders}
                currentUserId={userId}
                hasPendingPurchase={pendingCount > 0}
                initialUserCash={session?.user?.cash ?? 0}
            />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
        </>
    );
}
