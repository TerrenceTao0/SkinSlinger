import { prisma } from "@/lib/db";
import HomeClient from "../../components/HomeClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import type { Metadata } from 'next';

//

const PAGE_SIZE = 30;

function toSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const GAMES: Record<string, { dbValue: string; displayName: string; slug: string; description: string; blurb: string }> = {
    cs2: {
        dbValue: "CS2", displayName: "CS2", slug: "cs2",
        description: "Buy and sell CS2 skins with crypto on SkinSlinger — the P2P Counter-Strike 2 marketplace with 0% sales fee, no KYC, and no trade hold. Trade directly with real players. Easy, fast and secure.",
        blurb: "Buy Counter-Strike 2 skins with crypto. No KYC, no identity checks, 0% sales fee, and no trade hold.",
    },
    dota2: {
        dbValue: "Dota2", displayName: "Dota 2", slug: "dota2",
        description: "Buy and sell Dota 2 items with crypto on SkinSlinger — the P2P marketplace with 0% sales fee, no KYC, and no trade hold. Trade Dota 2 skins directly with real players. Easy, fast and secure.",
        blurb: "Buy Dota 2 items with crypto. No KYC, no identity checks, 0% sales fee, and no trade hold.",
    },
    rust: {
        dbValue: "Rust", displayName: "Rust", slug: "rust",
        description: "Buy and sell Rust skins with crypto on SkinSlinger — the P2P marketplace with 0% sales fee, no KYC, and no trade hold. Trade Rust skins directly with real players. Easy, fast and secure.",
        blurb: "Buy Rust skins with crypto. No KYC, no identity checks, 0% sales fee, and no trade hold.",
    },
    tf2: {
        dbValue: "TF2", displayName: "TF2", slug: "tf2",
        description: "Buy and sell TF2 items with crypto on SkinSlinger — the P2P Team Fortress 2 marketplace with 0% sales fee, no KYC, and no trade hold. Trade directly with real players. Easy, fast and secure.",
        blurb: "Buy Team Fortress 2 items with crypto. No KYC, no identity checks, 0% sales fee, and no trade hold.",
    },
};

const OG_IMAGE = { url: '/logo.png', width: 512, height: 512, alt: 'SkinSlinger' };

//

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> {
    const { game } = await params;
    const config = GAMES[game];
    if (!config) return {};
    const title = `Buy & Sell ${config.displayName} Skins with Crypto - 0% Fee, No KYC`;
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
        orderBy: { price: "desc" },
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

    const seen = new Set<string>();
    const itemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `${config.displayName} Skins for Sale on SkinSlinger`,
        "url": `${process.env.NEXTAUTH_URL}/market/${config.slug}`,
        "itemListElement": cards
            .filter(c => { const s = toSlug(c.marketName); if (seen.has(s)) return false; seen.add(s); return true; })
            .slice(0, 20)
            .map((c, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "name": c.marketName,
                "url": `${process.env.NEXTAUTH_URL}/item/${toSlug(c.marketName)}`,
            })),
    };

    return (
        <>
            <HomeClient
                initialListings={cards}
                initialHasMore={hasMore}
                currentUserId={currentUserId}
                hasPendingPurchase={hasPendingPurchase}
                initialGame={config.dbValue as "CS2" | "Dota2" | "Rust" | "TF2"}
                gameBlurb={config.blurb}
            />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
        </>
    );
}
