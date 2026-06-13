import { prisma } from "@/lib/db";
import HomeClient from "./Market";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from 'next';
import { toSlug, getBaseUrl, JsonLd } from "@/app/lib/site";

//

const PAGE_SIZE = 30;

type GameConfig = {
    dbValue: string;
    displayName: string;
    slug: string;
    title: string;
    description: string;
    h1: string;
    blurb: string;
    faqs: { q: string; a: string }[];
};

// Titles/H1s deliberately target the lower-competition long-tail intents
// ("sell X items for real money", "no KYC", per-game item vocabulary) where
// ranking is achievable, while CS2 keeps the head-term framing.
const GAMES: Record<string, GameConfig> = {
    cs2: {
        dbValue: "CS2", displayName: "CS2", slug: "cs2",
        title: "CS2 No KYC Skins Marketplace - Buy & Sell CS2 Skins with Crypto",
        description: "Buy and sell CS2 skins with crypto on SkinSlinger - the P2P Counter-Strike 2 marketplace with 0% sales fee, no KYC, and no trade hold. Trade directly with real players. Easy, fast and secure.",
        h1: "CS2 Skins Marketplace - No KYC, 0% Sales Fee",
        blurb: "Buy Counter-Strike 2 skins with crypto. No KYC, no identity checks, 0% sales fee, and no trade hold."
    },
    dota2: {
        dbValue: "Dota2", displayName: "Dota 2", slug: "dota2",
        title: "Dota 2 Marketplace - Sell Dota 2 Items for Real Money (No KYC)",
        description: "Sell Dota 2 items for real money on SkinSlinger - arcanas, immortals and sets. P2P marketplace with 0% sales fee, no KYC, crypto payouts in USDC, and no trade hold.",
        h1: "Sell Dota 2 Items for Real Money - Arcanas, Immortals & Sets",
        blurb: "Buy and sell Dota 2 items with crypto. No KYC, no identity checks, 0% sales fee, and no trade hold."
    },
    rust: {
        dbValue: "Rust", displayName: "Rust", slug: "rust",
        title: "Rust Skin Marketplace - Buy & Sell Rust Skins for Crypto (No KYC)",
        description: "Buy and sell Rust skins for real money on SkinSlinger - the P2P Rust marketplace with 0% sales fee, no KYC, and USDC crypto payouts. Trade Rust skins directly with real players.",
        h1: "Rust Skin Marketplace - Buy & Sell Rust Skins with Crypto",
        blurb: "Buy Rust skins with crypto. No KYC, no identity checks, 0% sales fee, and no trade hold."
    },
    tf2: {
        dbValue: "TF2", displayName: "TF2", slug: "tf2",
        title: "TF2 Marketplace - Sell TF2 Items & Unusuals for Real Money (No KYC)",
        description: "Sell TF2 items for real money on SkinSlinger - unusuals, hats, and keys. P2P Team Fortress 2 marketplace with 0% sales fee, no KYC, and USDC crypto payouts. No trade hold.",
        h1: "Sell TF2 Items for Real Money - Unusuals, Hats & Keys",
        blurb: "Buy and sell Team Fortress 2 items with crypto. No KYC, no identity checks, 0% sales fee, and no trade hold."
    },
};

const OG_IMAGE = { url: '/logo.png', width: 512, height: 512, alt: 'SkinSlinger' };

//

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> {
    const { game } = await params;
    const config = GAMES[game];
    if (!config) return {};
    const title = config.title;
    return {
        title,
        description: config.description,
        alternates: { canonical: `/market/${config.slug}` },
        openGraph: {
            title,
            description: config.description,
            url: `/market/${config.slug}`,
            images: [OG_IMAGE],
        },
        twitter: {
            card: 'summary',
            title,
            description: config.description,
            images: ['/logo.png'],
        },
    };
}

//

export default async function GameMarketPage({ params }: { params: Promise<{ game: string }> }) {
    const { game } = await params;
    const config = GAMES[game];
    if (!config) notFound();

    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id ?? null;

    const hasPendingPurchase = currentUserId ? (await prisma.purchase.count({
        where: { buyerId: currentUserId, status: "pending" },
    })) > 0 : false;

    const rows = await prisma.item_listing.findMany({
        take: PAGE_SIZE + 1,
        where: { game: config.dbValue },
        // Must match /api/listings exactly — the last id of this page is used as the
        // cursor for infinite scroll, so a different sort would skip/duplicate items.
        orderBy: [{ price: "desc" }, { id: "asc" }],
    });

    const page = rows.slice(0, PAGE_SIZE);
    const hasMore = rows.length > PAGE_SIZE;

    const assetIds = page.map(l => l.assetId);
    const floatItems = await prisma.item_float.findMany({ where: { assetId: { in: assetIds } } });
    const floatMap = new Map(floatItems.map(i => [i.assetId, i]));

    const cards = page
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
            stickers: (floatMap.get(l.assetId)?.stickers ?? null) as { stickerId: number; slot: number; name: string; image: string; wear: number | null }[] | null,
        }));

    const base = getBaseUrl();

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": `${base}/` },
            { "@type": "ListItem", "position": 2, "name": config.displayName, "item": `${base}/market/${config.slug}` },
        ],
    };

    const seen = new Set<string>();
    const itemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `${config.displayName} Skins for Sale on SkinSlinger`,
        "url": `${getBaseUrl()}/market/${config.slug}`,
        "itemListElement": cards
            .filter(c => { const s = toSlug(c.marketName); if (seen.has(s)) return false; seen.add(s); return true; })
            .slice(0, 20)
            .map((c, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "name": c.marketName,
                "url": `${getBaseUrl()}/item/${toSlug(c.marketName)}`,
            })),
    };

    return (
        <>
            {/* Suspense boundary required: HomeClient reads the URL via useSearchParams */}
            <Suspense>
                <HomeClient
                    initialListings={cards}
                    initialHasMore={hasMore}
                    currentUserId={currentUserId}
                    hasPendingPurchase={hasPendingPurchase}
                    initialGame={config.dbValue as "CS2" | "Dota2" | "Rust" | "TF2"}
                    gameBlurb={config.blurb}
                    seoTitle={config.h1}
                />
            </Suspense>
            <JsonLd data={itemListJsonLd} />
            <JsonLd data={breadcrumbJsonLd} />
        </>
    );
}
