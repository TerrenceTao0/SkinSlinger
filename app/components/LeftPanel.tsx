"use client"

import Image from "next/image";
import Link from "next/link";

type GameFilter = "all" | "CS2" | "Dota2" | "Rust" | "TF2"

//

const SLIDER_MAX = 5000;

const gameOptions: { label: string; value: GameFilter; href: string; icon: string }[] = [
    { label: "CS2",    value: "CS2",   href: "/market/cs2",   icon: "/cs2.png"  },
    { label: "Dota 2", value: "Dota2", href: "/market/dota2", icon: "/dota.png" },
    { label: "Rust",   value: "Rust",  href: "/market/rust",  icon: "/rust.png" },
    { label: "TF2",    value: "TF2",   href: "/market/tf2",   icon: "/tf2.png"  },
];

const wearOptions = [
    { label: "Factory New",    short: "FN" },
    { label: "Minimal Wear",   short: "MW" },
    { label: "Field-Tested",   short: "FT" },
    { label: "Well-Worn",      short: "WW" },
    { label: "Battle-Scarred", short: "BS"  },
];

const thumbClass = [
    "absolute w-full h-0 top-2",
    "appearance-none bg-transparent pointer-events-none",
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none",
    "[&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full",
    "[&::-webkit-slider-thumb]:bg-special [&::-webkit-slider-thumb]:cursor-pointer",
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:border-0",
    "[&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full",
    "[&::-moz-range-thumb]:bg-special [&::-moz-range-thumb]:cursor-pointer",
].join(" ");

//

export default function LeftPanel({
    currentGame,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    wear, setWear,
}: {
    currentGame: GameFilter,
    minPrice: string,
    setMinPrice: (v: string) => void,
    maxPrice: string,
    setMaxPrice: (v: string) => void,
    wear: string | null,
    setWear: (v: string | null) => void,
}) {
    const minVal = minPrice !== "" ? Math.min(parseFloat(minPrice) || 0, SLIDER_MAX) : 0;
    const maxVal = maxPrice !== "" ? Math.min(parseFloat(maxPrice) || SLIDER_MAX, SLIDER_MAX) : SLIDER_MAX;
    const fillLeft  = (minVal / SLIDER_MAX) * 100;
    const fillRight = 100 - (maxVal / SLIDER_MAX) * 100;

    return (
        <>
            {/* ── Desktop sidebar ── */}
            <div className="hidden md:flex flex-col fixed left-[2.5%] top-20 bottom-[calc(50vh-28rem)] w-43">
                <div className="bg-secondary rounded-sm flex flex-col h-full overflow-y-auto">

                    {/* Games */}
                    <div className="px-3 pt-3 pb-1">
                        <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-1.5">Games</p>
                        <div className="flex flex-col gap-0.5">
                            {gameOptions.map(({ label, value, href, icon }) => (
                                <Link
                                    key={value}
                                    href={href}
                                    className={`flex items-center gap-2.5 px-2.5 h-9 rounded-sm text-sm button transition-colors ${
                                        currentGame === value
                                            ? "bg-special font-medium"
                                            : "hover:bg-accent"
                                    }`}
                                >
                                    <Image src={icon} alt={label} width={18} height={18} className="rounded-sm shrink-0" />
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="px-3 py-3 mt-1 border-t border-gray-700/60">
                        <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-3">Price Range</p>

                        {/* Dual-thumb slider */}
                        <div className="relative h-4 mx-1 mb-3">
                            <div className="absolute top-1.5 left-0 right-0 h-1 bg-accent rounded-full" />
                            <div
                                className="absolute top-1.5 h-1 bg-special rounded-full"
                                style={{ left: `${fillLeft}%`, right: `${fillRight}%` }}
                            />
                            <input
                                type="range" min={0} max={SLIDER_MAX} step={1} value={minVal}
                                onChange={e => {
                                    const v = parseInt(e.target.value);
                                    setMinPrice(v === 0 ? "" : String(v));
                                }}
                                className={thumbClass}
                            />
                            <input
                                type="range" min={0} max={SLIDER_MAX} step={1} value={maxVal}
                                onChange={e => {
                                    const v = parseInt(e.target.value);
                                    setMaxPrice(v === SLIDER_MAX ? "" : String(v));
                                }}
                                className={thumbClass}
                            />
                        </div>

                        {/* Min / Max inputs */}
                        <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center bg-accent rounded-sm px-2 h-7 gap-1">
                                <span className="text-[11px] text-gray-500">$</span>
                                <input
                                    type="number" min={0} step={0.01} placeholder="0.00" value={minPrice}
                                    onChange={e => setMinPrice(e.target.value)}
                                    className="bg-transparent text-xs w-full outline-none"
                                />
                            </div>
                            <span className="text-gray-600 text-xs">–</span>
                            <div className="flex-1 flex items-center bg-accent rounded-sm px-2 h-7 gap-1">
                                <span className="text-[11px] text-gray-500">$</span>
                                <input
                                    type="number" min={0} step={0.01} placeholder="∞" value={maxPrice}
                                    onChange={e => setMaxPrice(e.target.value)}
                                    className="bg-transparent text-xs w-full outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* CS2 / TF2 Condition */}
                    {(currentGame === "CS2" || currentGame === "TF2") && (
                        <div className="px-3 py-3 border-t border-gray-700/60">
                            <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-2">Condition</p>
                            <div className="flex flex-col gap-1">
                                {wearOptions.map(({ label }) => (
                                    <button
                                        key={label}
                                        onClick={() => setWear(wear === label ? null : label)}
                                        className={`w-full h-8 text-xs rounded-sm button transition-colors text-left px-2.5 ${wear === label ? "bg-special font-medium" : "bg-accent"}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Mobile top bar ── */}
            <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-secondary border-b border-gray-700/50 flex flex-col">
                {/* Game links */}
                <div className="flex px-3 py-2 gap-1.5 overflow-x-auto no-scrollbar">
                    {gameOptions.map(({ label, value, href, icon }) => (
                        <Link
                            key={value}
                            href={href}
                            className={`shrink-0 flex items-center gap-1.5 px-3 h-8 text-sm rounded-sm button transition-colors ${
                                currentGame === value ? "bg-special font-medium" : "bg-accent"
                            }`}
                        >
                            <Image src={icon} alt={label} width={15} height={15} className="rounded-sm" />
                            {label}
                        </Link>
                    ))}
                </div>

                {/* Price + wear */}
                <div className="flex items-center gap-2 px-3 pb-2 overflow-x-auto no-scrollbar">
                    <div className="flex items-center bg-accent rounded-sm px-2 h-7 w-24 shrink-0 gap-1">
                        <span className="text-[11px] text-gray-500">$</span>
                        <input
                            type="number" min={0} step={0.01} placeholder="Min" value={minPrice}
                            onChange={e => setMinPrice(e.target.value)}
                            className="bg-transparent text-xs w-full outline-none"
                        />
                    </div>
                    <span className="text-gray-600 text-xs shrink-0">–</span>
                    <div className="flex items-center bg-accent rounded-sm px-2 h-7 w-24 shrink-0 gap-1">
                        <span className="text-[11px] text-gray-500">$</span>
                        <input
                            type="number" min={0} step={0.01} placeholder="∞" value={maxPrice}
                            onChange={e => setMaxPrice(e.target.value)}
                            className="bg-transparent text-xs w-full outline-none"
                        />
                    </div>
                    {(currentGame === "CS2" || currentGame === "TF2") && wearOptions.map(({ label, short }) => (
                        <button
                            key={label}
                            onClick={() => setWear(wear === label ? null : label)}
                            className={`shrink-0 px-2.5 h-7 text-xs rounded-sm button transition-colors ${wear === label ? "bg-special font-medium" : "bg-accent"}`}
                        >
                            {short}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
