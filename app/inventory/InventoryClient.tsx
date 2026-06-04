"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SteamItem } from '@/lib/steam';
import InventoryItemCard from '../components/InventoryItemCard';
import RightPanel from '../components/RightPanel';

//

function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
}

const url_start = "https://steamcommunity.com/tradeoffer/new/?partner="

//

function PromptSteamUrl({ onSubmit, checkUrl, error, waiting, url }: {
    onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void,
    checkUrl: (event: React.ChangeEvent<HTMLInputElement>) => void,
    error: string,
    waiting: boolean,
    url: string
}) {
    return (
        <>
            {/* Blur background */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-5"
            ></div>


            {/* Ask for Trade Url */}
            <form
                className="flex flex-col gap-1 rounded-[5px] text-center w-96 h-80 mt-5 z-6 bg-secondary rounded-sm frame-shadow"
                onSubmit={onSubmit}
            >
                <p className="mt-10 text-2xl">Enter your Steam Trade Url</p>

                <a href="http://steamcommunity.com/my/tradeoffers/privacy" target="_blank">
                    <button
                        type="button"
                        className="cursor-pointer"
                    >
                        <i className="text-special">Click to get your Trade Url</i>
                    </button>
                </a>

                <div className="input-box relative">
                    <input
                        id="url"
                        className="sign-up-input peer"
                        placeholder=""
                        required
                        onChange={checkUrl}
                    />

                    <label htmlFor="url" className="floating-label">Trade Url</label>

                    {error === "Invalid url" && (
                        <p className="error">Invalid Trade Url.</p>
                    )}
                </div>

                <button
                    disabled={waiting}
                    type="submit"
                    className={`rounded-md mt-5 button bg-accent self-center ${error === "" && url.includes(url_start) ? 'w-50 h-9 text-[15px]' : 'w-40 h-9 text-[15px]'}`}
                >
                    Enter
                </button>
            </form>
        </>
    )
}


export default function InventoryClient({ isSteamLinked, inventory, lastRefresh, inventoryToken }: { isSteamLinked: boolean, inventory: SteamItem[], lastRefresh: Date, inventoryToken: string }) {
    const router = useRouter();
    const [error, setError] = useState("");
    const [url, setUrl] = useState("");
    const [waiting, setWaiting] = useState(false);
    const [selling, setSelling] = useState<SteamItem[]>([])
    const [gameFilter, setGameFilter] = useState<"CS2" | "Dota2" | "Rust" | "TF2">("CS2")
    const [lastRefreshDisplay, setLastRefreshDisplay] = useState(() => timeAgo(lastRefresh));

    // null = still loading, number = resolved (0 means not found / too cheap)
    const [livePrices, setLivePrices] = useState<Map<string, number | null>>(() => {
        const map = new Map<string, number | null>();
        for (const item of inventory) {
            if (!map.has(item.market_name)) {
                map.set(item.market_name, item.price > 0 ? item.price : null);
            }
        }
        return map;
    });

    useEffect(() => {
        setLastRefreshDisplay(timeAgo(lastRefresh));

        const id = setInterval(() => setLastRefreshDisplay(timeAgo(lastRefresh)), 10000);

        return () => clearInterval(id);
    }, [lastRefresh]);

    useEffect(() => {
        const seen = new Set<string>();
        const unpriced = inventory.filter(i => {
            if (i.price > 0 || seen.has(i.market_name)) return false;
            seen.add(i.market_name);
            return true;
        });

        // Collect unique sticker names from items that have stickers
        const stickerSeen = new Set<string>();
        const stickerItems: { market_name: string; market_hash_name: string; game: string }[] = [];
        for (const item of inventory) {
            if (!item.stickers) continue;
            for (const s of item.stickers) {
                const name = `Sticker | ${s.name}`;
                if (!stickerSeen.has(name)) {
                    stickerSeen.add(name);
                    stickerItems.push({ market_name: name, market_hash_name: name, game: 'CS2' });
                }
            }
        }

        if (unpriced.length === 0 && stickerItems.length === 0) return;

        const controller = new AbortController();

        (async () => {
            try {
                const res = await fetch('/api/prices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: [
                        ...unpriced.map(i => ({ market_name: i.market_name, market_hash_name: i.market_hash_name, game: i.game })),
                        ...stickerItems,
                    ] }),
                    signal: controller.signal
                });

                if (!res.body) return;

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop()!;
                    for (const line of lines) {
                        if (!line.trim()) continue;
                        const { market_name, price } = JSON.parse(line);
                        setLivePrices(prev => new Map(prev).set(market_name, price));
                    }
                }
            } catch (e) {
                if ((e as Error).name === 'AbortError') return;
                // On error, leave prices as null — items stay visible rather than disappearing
            }
        })();

        return () => controller.abort();
    }, []);


    function checkUrl(event: React.ChangeEvent<HTMLInputElement>) {
        const url = event.target.value;
        setUrl(url);

        if (!url.includes(url_start) && url.length > 0) {
            setError("Invalid url");
        }
        else {
            setError("");
        }
    }


    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (error != "") {
            return;
        }


        setWaiting(true);

        try {
            const response = await fetch("/api/trade-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });


            const data = await response.json();

            if (!response.ok) {
                if (data.error) router.push(`/status?message=${data.error}`);
            }
            else {
                router.refresh();
            }
        }
        catch {
            setError("Network error");
        }
        finally {
            setWaiting(false);
        }
    }


    const filtered = inventory.filter(i => i.game === gameFilter);

    const stackedInventory = (() => {
        const result: (SteamItem & { quantity: number })[] = [];
        const commodityMap = new Map<string, SteamItem & { quantity: number }>();

        for (const item of filtered) {
            const priceState = livePrices.get(item.market_name);
            if (priceState !== null && (priceState ?? 0) < 0.30) continue;

            const basePrice = priceState ?? 0;
            const stickerValue = item.stickers
                ? item.stickers.reduce((sum, s) => {
                    const sp = livePrices.get(`Sticker | ${s.name}`) ?? 0;
                    return sum + sp * (1 - (s.wear ?? 0)) * 0.15;
                }, 0)
                : 0;
            const price = basePrice + stickerValue;
            const itemWithPrice = { ...item, price };

            if (item.commodity) {
                const existing = commodityMap.get(item.market_name);

                if (existing) {
                    existing.quantity += 1;
                } 
                else {
                    const entry = { ...itemWithPrice, quantity: 1 };
                    commodityMap.set(item.market_name, entry);
                    result.push(entry);
                }
            } 
            else {
                result.push({ ...itemWithPrice, quantity: 1 });
            }
        }

        return result.sort((a, b) => b.price - a.price);
    })();


    const totalValue = stackedInventory.reduce((sum, item) => {
        const priceState = livePrices.get(item.market_name);

        if (priceState === null) return sum;

        return sum + item.price * item.quantity;
    }, 0);

    
    return (
        <>
            {/* Desktop game filter sidebar */}
            <div className="hidden md:flex flex-col fixed left-[2.5%] top-20 w-43">
                <div className="bg-secondary rounded-sm px-3 py-3">
                    <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-1.5">Games</p>
                    <div className="flex flex-col gap-0.5">
                        {(["CS2", "Dota2", "Rust", "TF2"] as const).map(g => (
                            <button
                                key={g}
                                onClick={() => setGameFilter(g)}
                                className={`h-9 px-2.5 rounded-sm text-sm text-left button transition-colors ${gameFilter === g ? "bg-special font-medium" : "hover:bg-accent"}`}
                            >
                                {g === "Dota2" ? "Dota 2" : g}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <RightPanel selling={selling} setSelling={setSelling} onListed={() => router.refresh()} livePrices={livePrices} inventoryToken={inventoryToken} />

            {/* Mobile layout */}
            <div className="md:hidden flex flex-col h-full pt-[72px] px-[2.5%]">
                {/* Game filter*/}
                <div className="flex px-3 py-2 gap-1.5 overflow-x-auto no-scrollbar justify-center">
                    {(["CS2", "Dota2", "Rust", "TF2"] as const).map(g => (
                        <button
                            key={g}
                            onClick={() => setGameFilter(g)}
                            className={`shrink-0 px-3 h-8 text-sm rounded-sm button transition-colors ${gameFilter === g ? "bg-special font-medium" : "bg-accent"}`}
                        >
                            {g === "Dota2" ? "Dota 2" : g}
                        </button>
                    ))}
                </div>

                {!isSteamLinked ? (
                    <div className="flex items-center justify-center flex-1">
                        <PromptSteamUrl onSubmit={onSubmit} checkUrl={checkUrl} waiting={waiting} error={error} url={url} />
                    </div>
                ) : (
                    <div className={`flex flex-col flex-1 overflow-hidden${selling.length > 0 ? ' pb-16' : ''}`}>
                        {/* Info bar */}
                        <div className="bg-secondary flex items-center px-4 py-3 rounded-sm shrink-0 gap-6">
                            <div className="flex flex-col items-center">
                                <span className="text-[11px] uppercase tracking-widest opacity-50">
                                    Items
                                </span>

                                <span className="text-xl">
                                    {stackedInventory.length}
                                </span>
                            </div>

                            <div className="flex flex-col items-center">
                                <span className="text-[11px] uppercase tracking-widest opacity-50">
                                    Market Value
                                </span>

                                <span className="text-xl">
                                    ${totalValue.toFixed(2)}
                                </span>
                            </div>
                            
                            <div className="flex flex-col items-center ml-auto">
                                <span className="text-[11px] uppercase tracking-widest opacity-50">
                                    Last Updated
                                </span>

                                <span className="text-xl">
                                    {lastRefreshDisplay}
                                </span>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="overflow-y-auto flex-1 bg-secondary mt-2 p-3 rounded-sm">
                            <div className="grid grid-cols-2 gap-2 justify-start content-start">
                                {stackedInventory.map((item) => {
                                    const currentAmount = selling.filter(i => i.market_name === item.market_name).length;
                                    const remaining = item.quantity - currentAmount;

                                    if (remaining <= 0) return;

                                    return (
                                        <InventoryItemCard
                                            key={item.assetId}
                                            item={item}
                                            quantity={remaining}
                                            selling={selling}
                                            setSelling={setSelling}
                                            hexColor={item.hexColor}
                                            loading={livePrices.get(item.market_name) === null}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop layout */}
            <div className="hidden md:flex h-230 ml-12 w-full">
                <div className="w-43 shrink-0" />
                <div className="flex-1 ml-3 mr-100 mt-20 flex flex-col gap-2">
                    {!isSteamLinked ? (
                        <div className="flex items-center justify-center flex-1">
                            <PromptSteamUrl onSubmit={onSubmit} checkUrl={checkUrl} waiting={waiting} error={error} url={url} />
                        </div>
                    ) : (
                        <>
                            {/* Top info bar */}
                            <div className="bg-secondary h-18 flex items-center px-6 rounded-sm shrink-0">
                                <div className="flex items-center gap-10">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[11px] uppercase tracking-widest opacity-50">
                                            Items
                                        </span>

                                        <span className="text-2xl">
                                            {stackedInventory.length}
                                        </span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <span className="text-[11px] uppercase tracking-widest opacity-50">
                                            Market Value
                                        </span>

                                        <span className="text-2xl">
                                            ${totalValue.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-center ml-auto">
                                    <span className="text-[11px] uppercase tracking-widest opacity-50">
                                        Last Updated
                                    </span>

                                    <span className="text-2xl">
                                        {lastRefreshDisplay}
                                    </span>
                                </div>
                            </div>


                            {/* Item display */}
                            <div className="bg-secondary overflow-y-auto flex-1 min-h-0 grid grid-cols-5 justify-start content-start gap-2 p-3 rounded-sm">
                                {stackedInventory.map((item) => {
                                    const currentAmount = selling.filter(i => i.market_name === item.market_name).length;
                                    const remaining = item.quantity - currentAmount;

                                    if (remaining <= 0) return;

                                    return (
                                        <InventoryItemCard
                                            key={item.assetId}
                                            item={item}
                                            quantity={remaining}
                                            selling={selling}
                                            setSelling={setSelling}
                                            hexColor={item.hexColor}
                                            loading={livePrices.get(item.market_name) === null}
                                        />
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

