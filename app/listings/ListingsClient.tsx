"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import FloatBar from "@/app/components/FloatBar";

//

type Listing = {
    id: string;
    assetId: string;
    marketName: string;
    price: number;
    game: string | null;
    icon: string | null;
    hexColor: string | null;
    commodity: boolean;
    floatValue: number | null;
    paintSeed: number | null;
};

type ListingGroup = {
    ids: string[];
    marketName: string;
    price: number;
    icon: string | null;
    hexColor: string | null;
    commodity: boolean;
    floatValue: number | null;
    paintSeed: number | null;
};

function groupListings(listings: Listing[]): ListingGroup[] {
    const map = new Map<string, ListingGroup>();
    for (const l of listings) {
        const key = l.commodity ? l.marketName : l.id;
        const existing = map.get(key);
        if (existing) {
            existing.ids.push(l.id);
        } else {
            map.set(key, {
                ids: [l.id],
                marketName: l.marketName,
                price: l.price,
                icon: l.icon,
                hexColor: l.hexColor,
                commodity: l.commodity,
                floatValue: l.floatValue,
                paintSeed: l.paintSeed,
            });
        }
    }
    return [...map.values()];
}

//

function ListingCard({ group }: { group: ListingGroup }) {
    const router = useRouter();
    const [priceStr, setPriceStr] = useState(group.price.toFixed(2));
    const [confirming, setConfirming] = useState(false);
    const [saving, setSaving] = useState(false);
    const [delisting, setDelisting] = useState(false);
    const [error, setError] = useState("");

    const parsedPrice = parseFloat(priceStr);
    const isDirty = !isNaN(parsedPrice) && parsedPrice > 0 && parsedPrice !== group.price;
    const totalPrice = (isNaN(parsedPrice) ? group.price : parsedPrice) * group.ids.length;

    async function savePrice() {
        setSaving(true);
        setError("");

        for (const id of group.ids) {
            const res = await fetch(`/api/listings/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ price: parsedPrice }),
            });


            if (!res.ok) {
                const data = await res.json();

                setError(data.error ?? "Failed to update price");
                setSaving(false);

                return;
            }
        }
        router.refresh();
        setSaving(false);
    }

    async function delist() {
        setDelisting(true);
        setError("");

        for (const id of group.ids) {
            const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? "Something went wrong");
                setDelisting(false);
                setConfirming(false);

                return;
            }
        }


        router.refresh();
        setConfirming(false);
    }

    return (
        <div
            className="relative h-65 bg-accent rounded-sm flex flex-col overflow-hidden transition-all duration-200 hover:scale-[1.03] hover:-translate-y-1 hover:z-10 hover:[box-shadow:0_8px_20px_var(--glow),0_4px_10px_rgba(0,0,0,0.5)]"
            style={{ '--glow': `#${group.hexColor}44` } as React.CSSProperties}
        >
            {/* Name */}
            <div className="shrink-0 flex justify-between items-start px-2 pt-2 pb-1">
                <p style={{ color: `#${group.hexColor}` }} className="text-[11px] leading-tight line-clamp-2 flex-1 pr-1">
                    {group.marketName}
                </p>
                {group.ids.length > 1 && (
                    <p className="text-[11px] opacity-60 shrink-0">[x{group.ids.length}]</p>
                )}
            </div>


            {/* Image */}
            <div
                className="relative h-24 shrink-0 mx-2 flex items-center justify-center"
                style={{ filter: `drop-shadow(0 0 10px #${group.hexColor}99)` }}
            >
                {group.icon && (
                    <Image src={group.icon} alt={group.marketName} width={90} height={90} style={{ width: 'auto', maxHeight: '90px' }} />
                )}
            </div>


            {/* Float / Pattern */}
            <div className={`shrink-0 px-2 pb-1 flex flex-col gap-0.5 text-[10px] text-gray-500 ${group.floatValue === null ? 'invisible' : ''}`}>
                {group.paintSeed != null
                    ? <span>Pattern <span className="text-gray-300">#{group.paintSeed}</span></span>
                    : <span>&nbsp;</span>
                }
                <span>Float <span className="text-gray-300 font-mono">{group.floatValue?.toFixed(9).replace(/0+$/, '') ?? ''}</span></span>
            </div>
            <div className={`shrink-0 px-2 pb-1 ${group.floatValue === null ? 'invisible' : ''}`}>
                <FloatBar value={group.floatValue ?? 0} showLabels={false} />
            </div>

            {/* Price + save */}
            <div className="shrink-0 px-2 pt-2 pb-1 flex flex-col gap-1 mt-auto">
                <button
                    onClick={savePrice}
                    disabled={saving || !isDirty}
                    className={`h-8 w-full rounded-sm bg-special button text-sm ${isDirty ? '' : 'hidden'}`}
                >
                    {saving ? "..." : "Save price"}
                </button>

                <div className="flex items-center bg-primary rounded-sm px-2 h-8">
                    <span className="text-xs opacity-50 mr-1">
                        $
                    </span>

                    <input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={priceStr}
                        onChange={e => setPriceStr(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm w-0"
                    />

                    {group.ids.length > 1 && (
                        <span className="text-xs opacity-40 shrink-0 ml-1">
                            = ${totalPrice.toFixed(2)}
                        </span>
                    )}
                </div>

                {error && <p className="text-red-400 text-xs">
                    {error}
                </p>}
            </div>

            <button
                onClick={() => setConfirming(true)}
                className="shrink-0 h-10 w-full bg-remove button text-sm"
            >
                DELIST
            </button>
            

            {/* Confirmation overlay */}
            {confirming && (
                <div className="absolute inset-0 bg-accent/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4">
                    <p className="text-sm font-medium">
                        Remove listing?
                    </p>

                    <div className="flex gap-2 w-full">
                        <button
                            onClick={delist}
                            disabled={delisting}
                            className="flex-1 h-9 rounded-sm bg-remove button text-sm"
                        >
                            {delisting ? "..." : "Yes"}
                        </button>

                        <button
                            onClick={() => setConfirming(false)}
                            disabled={delisting}
                            className="flex-1 h-9 rounded-sm bg-primary button text-sm"
                        >
                            No
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

//

export default function ListingsClient({ listings }: { listings: Listing[] }) {
    const groups = groupListings(listings);

    return (
        <div className="w-full flex justify-center mt-20 px-8">
            <div className="w-full max-w-7xl flex flex-col gap-4">
                <p className="text-xl">
                    My Listings
                </p>
                
                {groups.length === 0 ? (
                    <p className="opacity-40">
                        You have no active listings.
                    </p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {groups.map((g) => <ListingCard key={g.ids[0]} group={g} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
