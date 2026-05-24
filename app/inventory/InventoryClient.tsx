"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SteamItem } from '@/lib/steam';
import InventoryItemCard from '../components/InventoryItemCard';
import LeftPanel from '../components/LeftPanel';
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
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void,
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
                className="flex flex-col gap-1 rounded-[5px] text-center w-96 h-80 mt-5 z-6 bg-secondary frame-shadow"
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


export default function InventoryClient({ isSteamLinked, inventory, lastRefresh }: { isSteamLinked: boolean, inventory: SteamItem[], lastRefresh: Date }) {
    const router = useRouter();
    const [error, setError] = useState("");
    const [url, setUrl] = useState("");
    const [waiting, setWaiting] = useState(false);
    const [selling, setSelling] = useState<SteamItem[]>([])
    const [gameFilter, setGameFilter] = useState<"all" | "CS2" | "Dota2" | "Rust">("all")
    const [lastRefreshDisplay, setLastRefreshDisplay] = useState(() => timeAgo(lastRefresh));

    useEffect(() => {
        setLastRefreshDisplay(timeAgo(lastRefresh));

        const id = setInterval(() => setLastRefreshDisplay(timeAgo(lastRefresh)), 10000);

        return () => clearInterval(id);
    }, [lastRefresh]);

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


    const filtered = gameFilter === "all" ? inventory : inventory.filter(i => i.game === gameFilter);

    const stackedInventory = (() => {
        const result: (SteamItem & { quantity: number })[] = [];
        const commodityMap = new Map<string, SteamItem & { quantity: number }>();

        for (const item of filtered) {
            if (item.commodity) {
                const existing = commodityMap.get(item.market_name);
                if (existing) {
                    existing.quantity += 1;
                } else {
                    const entry = { ...item, quantity: 1 };
                    commodityMap.set(item.market_name, entry);
                    result.push(entry);
                }
            } else {
                result.push({ ...item, quantity: 1 });
            }
        }

        return result.sort((a, b) => b.price - a.price);
    })();
    const totalValue = stackedInventory.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <>
            <LeftPanel gameFilter={gameFilter} setGameFilter={setGameFilter} />
            <RightPanel selling={selling} setSelling={setSelling} onListed={() => router.refresh()} />

            <div className="h-full w-full flex justify-center items-center">
                <div className="w-200 h-150 flex justify-center items-center">
                    {!isSteamLinked ? (
                        <PromptSteamUrl onSubmit={onSubmit} checkUrl={checkUrl} waiting={waiting} error={error} url={url} />
                    ) : (
                        <div>
                            {/* Top info bar */}
                            <div className="bg-secondary w-310 h-18 mt-13 absolute flex items-center px-6">
                                <div className="flex items-center gap-10">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[11px] uppercase tracking-widest opacity-50">Items</span>
                                        <span className="text-2xl">{stackedInventory.length}</span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <span className="text-[11px] uppercase tracking-widest opacity-50">Steam Value</span>
                                        <span className="text-2xl">${totalValue.toFixed(2)}</span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <span className="text-[11px] uppercase tracking-widest opacity-50">Default Market Value (-20%)</span>
                                        <span className="text-2xl">${(totalValue / 1.2).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center ml-auto">
                                    <span className="text-[11px] uppercase tracking-widest opacity-50">Last Updated</span>
                                    <span className="text-2xl">{lastRefreshDisplay}</span>
                                </div>
                            </div>


                            {/* Item display */}
                            <div className="bg-secondary w-310 mr-30 overflow-y-auto h-190 mt-34 grid grid-cols-6 justify-start content-start gap-2 p-3">
                                {stackedInventory.map((item) => {
                                    const currentAmount = selling.filter(i => i.market_name === item.market_name).length;
                                    const remaining = item.quantity - currentAmount

                                    if (remaining <= 0) return;

                                    return (
                                        <InventoryItemCard 
                                            key={item.assetId} 
                                            item={item} 
                                            quantity={remaining} 
                                            selling={selling} 
                                            setSelling={setSelling} 
                                            hexColor={item.hexColor} 
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

