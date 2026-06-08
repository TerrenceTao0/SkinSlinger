"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import FloatBar from "@/app/components/FloatBar";

function toSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

//

type Sticker = { stickerId: number; slot: number; name: string; image: string; wear: number | null }
type Listing = { id: string; marketName: string; price: number; icon: string | null; hexColor: string | null; game: string | null; commodity: boolean; floatValue: number | null; stickers: unknown }

export default function ProfileClient({ sales, purchases, saleCount, purchaseCount, createdAt, steamId, listings, name, image }: { sales: number; purchases: number; saleCount: number; purchaseCount: number; createdAt: Date; steamId: string | null; listings: Listing[]; name: string | null; image: string | null }) {
    const [copied, setCopied] = useState(false)

    function copyProfileLink() {
        navigator.clipboard.writeText(`${window.location.origin}/user/${steamId}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }
    const total_volume = sales + purchases
    const memberSince = new Date(createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    const [accountAge] = useState(() => {
        const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
        return days >= 365 ? `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m` : days >= 30 ? `${Math.floor(days / 30)} months` : `${days} days`
    })

    let tier = "I"

    if (total_volume >= 25000) {
        tier = "IV"
    }
    else if (total_volume >= 5000) {
        tier = "III"
    }
    else if (total_volume >= 1000) {
        tier = "II"
    }

    const tierColor = tier === "IV" ? "text-cyan-400" : tier === "III" ? "text-yellow-400" : tier === "II" ? "text-amber-600" : "text-white"
    const currentTierVolume = tier === "I" ? 0 : tier === "II" ? 1000 : tier === "III" ? 5000 : 25000
    const nextTierVolume = tier === "I" ? 1000 : tier === "II" ? 5000 : 25000
    const nextTierLabel = tier === "I" ? "II" : tier === "II" ? "III" : "IV"
    const remaining = nextTierVolume - total_volume
    const progress = tier === "IV" ? 100 : Math.min((total_volume - currentTierVolume) / (nextTierVolume - currentTierVolume), 1) * 100

    const [displayProgress, setDisplayProgress] = useState(0)

    useEffect(() => {
        const timer = setTimeout(() => setDisplayProgress(progress), 100)
        return () => clearTimeout(timer)
    }, [progress])

    const withdrawFee = tier === "IV" ? "0.5%" : tier === "III" ? "1.0%" : tier === "II" ? "1.5%" : "2%"
    const nextWithdrawFee = tier === "I" ? "1.5%" : tier === "II" ? "1.0%" : tier === "III" ? "0.5%" : null

    return (
        <div className="w-full h-full flex flex-col md:flex-row justify-center md:items-center overflow-y-auto py-8 gap-4 px-3">
            <div className="flex flex-col items-center gap-6 w-full max-w-sm bg-gradient-to-b from-transparent to-secondary rounded-sm py-10 px-3 shrink-0">
                <div className="flex flex-col items-center gap-3">
                    {image && (
                        <div className="rounded-full ring-2 ring-special/50 p-0.5">
                            <Image src={image} alt="Profile" height={90} width={90} className="rounded-full" />
                        </div>
                    )}

                    {name && (
                        <p className="text-lg font-semibold">
                            {name}
                        </p>
                    )}
                    <h1 className={`text-3xl font-bold tracking-wide ${tierColor}`}>
                        TIER {tier}
                    </h1>
                </div>

  
                <div className="w-full flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>
                            Volume
                        </span>

                        <span>
                            ${total_volume.toLocaleString()} / ${(tier === "IV" ? 25000 : nextTierVolume).toLocaleString()}
                        </span>
                    </div>

                    <div className="bg-accent w-full h-3 rounded-full overflow-hidden relative">
                        <div
                            className="bg-special h-full rounded-full transition-[width] duration-1000 ease-out absolute top-0 left-0"
                            style={{ width: `${displayProgress}%` }}
                        />
                    </div>

                    {tier !== "IV" && (
                        <p className="text-xs text-gray-500 text-right">
                            ${remaining.toLocaleString(undefined, { maximumFractionDigits: 2 })} until Tier {nextTierLabel}
                        </p>
                    )}
                </div>

  
                <div className="bg-secondary w-full rounded-sm divide-y divide-gray-700">
                    <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-sm text-gray-400">
                            Withdrawal Fee
                        </span>

                        <div className="flex items-center gap-3">
                            {nextWithdrawFee && (
                                <span className="text-xs text-gray-500">
                                    → {nextWithdrawFee} at Tier {nextTierLabel}
                                </span>
                            )}

                            <span className="text-sm font-medium text-special">
                                {withdrawFee}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-sm text-gray-400">
                            Member Since
                        </span>

                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">
                                {accountAge}
                            </span>

                            <span className="text-sm font-medium">
                                {memberSince}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-sm text-gray-400">
                            Purchases
                        </span>

                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">
                                {purchaseCount} orders
                            </span>

                            <span className="text-sm font-medium">
                                ${purchases.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-sm text-gray-400">
                            Sales
                        </span>

                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">
                                {saleCount} orders
                            </span>

                            <span className="text-sm font-medium">
                                ${sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-sm text-gray-400">
                            Total Volume
                        </span>

                        <span className="text-sm font-semibold text-special">
                            ${total_volume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                </div>

                <button
                    onClick={copyProfileLink}
                    className="text-xs button w-80 bg-accent h-10 rounded-sm"
                >
                    {copied ? "Copied!" : "Copy profile link"}
                </button>
            </div>


            {/* User's current listings */}
            {listings.length > 0 && (
                <div className="flex flex-col gap-2 w-100">
                    <p className="text-xs text-gray-500 uppercase tracking-widest">
                        Active Listings ({listings.length})
                    </p>

                    <div className="bg-secondary rounded-sm divide-y divide-gray-700 overflow-y-auto max-h-[600px]">
                        {(() => {
                            type Row = { listing: Listing; quantity: number; href: string }
                            const commodityMap = new Map<string, Row>()
                            const rows: Row[] = []

                            for (const listing of listings) {
                                if (listing.commodity) {
                                    const existing = commodityMap.get(listing.marketName)
                                    if (existing) {
                                        existing.quantity += 1
                                    } else {
                                        const row: Row = { listing, quantity: 1, href: `/item/${toSlug(listing.marketName)}/${listing.id}?from=profile` }
                                        commodityMap.set(listing.marketName, row)
                                        rows.push(row)
                                    }
                                } else {
                                    rows.push({ listing, quantity: 1, href: `/item/${toSlug(listing.marketName)}/${listing.id}?from=profile` })
                                }
                            }

                            return rows.map(({ listing, quantity, href }) => (
                                <Link
                                    key={listing.commodity ? listing.marketName : listing.id}
                                    href={href}
                                    className="flex flex-col gap-1.5 px-4 py-4 hover:bg-accent transition-colors"
                                >
                                    <div className="flex gap-3 items-start">
                                        {/* Left: icon */}
                                        {listing.icon && (
                                            <Image
                                                src={listing.icon}
                                                alt={listing.marketName}
                                                width={64}
                                                height={64}
                                                className="object-contain shrink-0"
                                            />
                                        )}

                                        {/* Middle: name, float, stickers */}
                                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-sm leading-none truncate">
                                                    {listing.marketName}
                                                </span>

                                                {listing.commodity && (
                                                    <span className="text-xs text-gray-500 shrink-0 leading-none">
                                                        ×{quantity}
                                                    </span>
                                                )}
                                            </div>

                                            {listing.floatValue != null && (
                                                <span className="text-[10px] text-gray-500 font-mono">
                                                    {listing.floatValue.toFixed(10).replace(/0+$/, '')}
                                                </span>
                                            )}

                                            {(() => {
                                                const stickers = Array.isArray(listing.stickers) ? (listing.stickers as Sticker[]) : null
                                                if (!stickers || stickers.length === 0) return null
                                                return (
                                                    <div className="flex gap-1">
                                                        {stickers.map((s, i) => (
                                                            <div key={i} title={s.name}>
                                                                <Image src={s.image} alt={s.name} width={24} height={24} style={{ width: 'auto', height: 24 }} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )
                                            })()}
                                        </div>

                                        {/* Right: price */}
                                        <span className="text-sm font-medium text-special shrink-0 leading-none">
                                            ${listing.price.toFixed(2)}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        })()}
                    </div>
                </div>
            )}
        </div>
    )
}

