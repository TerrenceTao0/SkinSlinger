import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import type { Metadata } from "next";
import BuyButton from "./BuyButton";
import FloatBar from "@/app/components/FloatBar";
import { GAME_NAMES, GAME_SLUGS, getBaseUrl, JsonLd } from "@/app/lib/site";

function wearLabel(f: number): string {
    if (f < 0.07) return 'Factory New';
    if (f < 0.15) return 'Minimal Wear';
    if (f < 0.38) return 'Field-Tested';
    if (f < 0.45) return 'Well-Worn';
    return 'Battle-Scarred';
}

//

const getListing = cache(async (id: string) => {
    const listing = await prisma.item_listing.findUnique({ where: { id } });
    if (!listing || !listing.icon || !listing.hexColor || !listing.game) return null;

    const [float, commodityCount] = await Promise.all([
        prisma.item_float.findUnique({ where: { assetId: listing.assetId } }),
        listing.commodity
            ? prisma.item_listing.count({ where: { marketName: listing.marketName, commodity: true } })
            : Promise.resolve(1),
    ]);

    return { listing, float, commodityCount };
});

//

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }): Promise<Metadata> {
    const { slug, id } = await params;
    const data = await getListing(id);
    if (!data) return {};

    const { listing } = data;
    const gameName = GAME_NAMES[listing.game!] ?? listing.game!;
    const title = `${listing.marketName} - ${gameName} - SkinSlinger`;
    const description = `Buy ${listing.marketName}. No KYC, 0% sales fee, pay with crypto. Your ${gameName} skin marketplace.`;

    return {
        title,
        description,
        alternates: { canonical: `/item/${slug}` },
        openGraph: {
            title,
            description,
            url: `/item/${slug}/${id}`,
            images: [{ url: listing.icon!, alt: listing.marketName }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [listing.icon!],
        },
    };
}

//

export default async function ItemPage({ params, searchParams }: { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ from?: string }> }) {
    const { slug, id } = await params;
    const { from } = await searchParams;
    const data = await getListing(id);
    if (!data) notFound();

    const { listing, float, commodityCount } = data;
    const gameName = GAME_NAMES[listing.game!] ?? listing.game!;
    const gameSlug = GAME_SLUGS[listing.game!] ?? "cs2";

    const sellerSteamId = from === "profile"
        ? (await prisma.user.findUnique({ where: { id: listing.userId }, select: { steam_id: true, name: true } }))
        : null;
    const stickers = float?.stickers as { stickerId: number; slot: number; name: string; image: string; wear: number | null }[] | null;

    const base = getBaseUrl();

    const jsonLd = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": `${listing.marketName} - ${gameName}`,
        "url": `${base}/item/${slug}/${id}`,
        "image": listing.icon,
        "description": `Buy ${listing.marketName}. No KYC, 0% sales fee, pay with crypto.`,
        "offers": {
            "@type": "Offer",
            "price": listing.price.toFixed(2),
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock",
            "url": `${base}/item/${slug}/${id}`,
            "seller": { "@type": "Organization", "name": "SkinSlinger", "url": base },
        },
    };

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": `${base}/` },
            { "@type": "ListItem", "position": 2, "name": gameName, "item": `${base}/market/${gameSlug}` },
            { "@type": "ListItem", "position": 3, "name": listing.marketName, "item": `${base}/item/${slug}` },
            { "@type": "ListItem", "position": 4, "name": `$${listing.price.toFixed(2)}`, "item": `${base}/item/${slug}/${id}` },
        ],
    };

    return (
        <div className="overflow-y-auto h-full flex justify-center items-center py-12 px-4">
            <div className="w-full max-w-sm flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    {sellerSteamId?.steam_id ? (
                        <Link href={`/user/${sellerSteamId.steam_id}`} className="text-sm text-gray-400 hover:text-white transition-colors">
                            ← Back to {sellerSteamId.name ?? "seller"}'s profile
                        </Link>
                    ) : (
                        <>
                            <Link href={`/market/${gameSlug}`} className="text-sm text-gray-400 hover:text-white transition-colors">
                                ← Back to {gameName} market
                            </Link>
                            <Link href={`/item/${slug}`} className="text-sm text-gray-400 hover:text-white transition-colors">
                                ← All {listing.marketName} listings
                            </Link>
                        </>
                    )}
                </div>

                <div
                    className="bg-secondary rounded-sm p-8 flex flex-col items-center gap-4"
                    style={{ boxShadow: `0 0 40px #${listing.hexColor}33, 0 8px 32px rgba(0,0,0,0.6)` }}
                >
                    <div style={{ filter: `drop-shadow(0 0 16px #${listing.hexColor}99)` }}>
                        <Image src={listing.icon!} alt={listing.marketName} width={220} height={220} style={{ width: 'auto', height: 'auto' }} />
                    </div>

                    <h1 style={{ color: `#${listing.hexColor}` }} className="text-xl font-semibold text-center">
                        {listing.marketName}
                    </h1>

                    <span className="text-xs text-gray-500 bg-accent px-2 py-1 rounded-sm">{gameName}</span>

                    <div className="w-full flex flex-col gap-2.5 text-sm border-t border-gray-700/60 pt-4">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Price</span>
                            <span className="font-semibold">${listing.price.toFixed(2)}</span>
                        </div>

                        {float?.floatValue != null && (
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Float</span>
                                    <span className="text-xs text-gray-400">{wearLabel(float.floatValue)}</span>
                                </div>
                                <FloatBar value={float.floatValue} />
                            </div>
                        )}

                        {float?.paintSeed != null && (
                            <div className="flex justify-between">
                                <span className="text-gray-400">Pattern</span>
                                <span>#{float.paintSeed}</span>
                            </div>
                        )}
                    </div>

                    {stickers && stickers.length > 0 && (
                        <div className="w-full flex flex-col gap-2">
                            <span className="text-sm text-gray-400">Stickers</span>
                            <div className="flex gap-2 flex-wrap">
                                {stickers.map((s, i) => (
                                    <div key={i} className="flex flex-col items-center gap-0.5" title={s.name}>
                                        <Image src={s.image} alt={s.name} width={40} height={40} className="h-10 w-auto" />
                                        <span className="text-[10px] text-gray-500 max-w-10 truncate">{s.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <BuyButton
                        id={listing.id}
                        marketName={listing.marketName}
                        price={listing.price}
                        icon={listing.icon!}
                        hexColor={listing.hexColor!}
                        commodity={listing.commodity}
                        maxQuantity={commodityCount}
                    />
                </div>
            </div>

            <JsonLd data={jsonLd} />
            <JsonLd data={breadcrumbJsonLd} />
        </div>
    );
}
