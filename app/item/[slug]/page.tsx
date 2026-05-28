import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import type { Metadata } from "next";

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
            "offerCount": String(listings.length),
            "priceCurrency": "USD",
            "availability": "http://schema.org/InStock",
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

    return (
        <div className="overflow-y-auto h-full flex justify-center pt-24 pb-12 px-4">
            <div className="w-full max-w-sm flex flex-col gap-6">
                <Link href={`/market/${gameSlug}`} className="text-sm text-gray-400 hover:text-white transition-colors">
                    ← Back to {gameName} market
                </Link>

                <div
                    className="bg-secondary rounded-sm p-8 flex flex-col items-center gap-4"
                    style={{ boxShadow: `0 0 40px #${inv.hexColor}33, 0 8px 32px rgba(0,0,0,0.6)` }}
                >
                    <div style={{ filter: `drop-shadow(0 0 16px #${inv.hexColor}99)` }}>
                        <Image src={inv.icon} alt={marketName} width={220} height={220} style={{ width: 'auto' }} priority />
                    </div>

                    <h1 style={{ color: `#${inv.hexColor}` }} className="text-xl font-semibold text-center">
                        {marketName}
                    </h1>

                    <span className="text-xs text-gray-500 bg-accent px-2 py-1 rounded-sm">{gameName}</span>

                    <div className="w-full flex flex-col gap-2.5 text-sm border-t border-gray-700/60 pt-4">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Available</span>
                            <span className="font-semibold">{listings.length} listing{listings.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Starting from</span>
                            <span className="font-semibold">${lowPrice.toFixed(2)}</span>
                        </div>
                        {listings.length > 1 && (
                            <div className="flex justify-between">
                                <span className="text-gray-400">Up to</span>
                                <span>${highPrice.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    <div className="w-full flex flex-col gap-1.5">
                        {listings.slice(0, 10).map(l => (
                            <Link
                                key={l.id}
                                href={`/item/${slug}/${l.id}`}
                                className="flex justify-between items-center bg-accent rounded-sm px-3 h-10 hover:bg-gray-600 transition-colors text-sm"
                            >
                                <span className="font-medium">${l.price.toFixed(2)}</span>
                                <span className="text-gray-400 text-xs">Buy →</span>
                            </Link>
                        ))}
                        {listings.length > 10 && (
                            <p className="text-center text-xs text-gray-500 mt-1">
                                +{listings.length - 10} more available on the market
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
        </div>
    );
}
