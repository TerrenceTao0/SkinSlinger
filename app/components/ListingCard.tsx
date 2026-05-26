"use client"

import Image from "next/image";
import Link from "next/link";
import { DisplayCard } from "./HomeClient";

function toSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

//

export default function ListingCard(
    {
        id,
        marketName,
        price,
        icon,
        hexColor,
        quantity,
        sellerId,
        currentUserId,
        onBuy,
        onPreview,
    }:
    DisplayCard & { currentUserId: string | null, onBuy: () => void, onPreview: () => void })
{
    const isOwned = currentUserId !== null && currentUserId === sellerId;

    return (
        <div
            className="bg-accent h-50 w-full rounded-sm relative transition-all duration-200 hover:scale-[1.04] hover:-translate-y-1 hover:z-10 hover:[box-shadow:0_8px_20px_var(--glow),0_4px_10px_rgba(0,0,0,0.5)]"
            style={{ '--glow': `#${hexColor}44` } as React.CSSProperties}
        >
            <div className="flex justify-between mt-2 pl-2 pr-2 w-full absolute z-2">
                <Link href={`/item/${toSlug(marketName)}/${id}`} onClick={e => e.stopPropagation()} style={{ color: `#${hexColor}` }} className="text-[12px] w-35 hover:underline">
                    {marketName}
                </Link>

                {quantity > 1 && (
                    <h1 className="text-[12px]">[x{quantity}]</h1>
                )}
            </div>

            <button
                className="cursor-pointer absolute inset-0 flex justify-center items-center z-0 mb-5"
                style={{ filter: `drop-shadow(0 0 8px #${hexColor}99)` }}
                onClick={onPreview}
            >
                <Image
                    src={icon}
                    alt="Failed To Load"
                    style={{ width: 'auto' }}
                    width={100}
                    height={100}
                />
            </button>

            <div className="flex justify-between mt-34 z-2">
                <p className="text-[12px] pl-2">
                    ${price.toFixed(2)}
                </p>
            </div>

            <div className="flex justify-center bottom-0 w-full absolute">
                <button
                    onClick={onBuy}
                    disabled={isOwned}
                    className={`rounded-sm w-full h-10 ${isOwned ? "bg-accent opacity-50 cursor-default" : "bg-less-special button"}`}
                    style={!isOwned && hexColor !== 'b0c3d9' ? { borderTop: `2px solid #${hexColor}` } : {}}
                >
                    {isOwned ? "OWNED" : "BUY"}
                </button>
            </div>
        </div>
    );
}
