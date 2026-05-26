"use client"

import { SteamItem } from '@/lib/steam';
import { useState } from 'react';
import SellItemCard from './SellItemCard';

//

function ListPrompt({ totalValue, itemCount, onConfirm, setShowPrompt }: {
    totalValue: number
    itemCount: number
    onConfirm: () => void
    setShowPrompt: (value: boolean) => void
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPrompt(false)}>
            <div className="bg-secondary rounded-sm p-8 flex flex-col gap-4 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                <p className="text-lg font-medium">Confirm listing</p>

                <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                        <span className="opacity-60">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                        <span>${totalValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="opacity-60">Listing fee</span>
                        <span className="text-special">0%</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-700 pt-2 mt-1 font-medium">
                        <span>Total earnings</span>
                        <span>${totalValue.toFixed(2)}</span>
                    </div>
                </div>

                <p className="text-xs opacity-40">Only a 2% fee applies on withdrawals.</p>

                <div className="flex gap-3">
                    <button className="bg-special button flex-1 h-10 rounded-sm" onClick={onConfirm}>
                        Confirm
                    </button>
                    <button className="bg-accent button flex-1 h-10 rounded-sm" onClick={() => setShowPrompt(false)}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function RightPanel({ selling, setSelling, onListed, livePrices }: {
    selling: SteamItem[],
    setSelling: React.Dispatch<React.SetStateAction<SteamItem[]>>,
    onListed: () => void,
    livePrices: Map<string, number | null>
}) {
    const [showPrompt, setShowPrompt] = useState(false);
    const [mobileQueueOpen, setMobileQueueOpen] = useState(false);
    const [priceMap, setPriceMap] = useState<Record<string, string>>({});

    async function listItems() {
        const items = stackedQueue.map(item => ({
            assetId: item.assetId,
            marketName: item.market_name,
            price: parseFloat(priceMap[item.market_name] ?? (item.price * 0.80).toFixed(2)),
            game: item.game,
            commodity: item.commodity,
            quantity: item.quantity,
        }));

        const response = await fetch("/api/listings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
        });

        if (response.ok) {
            setSelling([]);
            setShowPrompt(false);
            onListed();
        }
    }

    function remove(market_name: string) {
        const index = selling.findIndex(x => x.market_name === market_name);

        if (index >= 0) {
            setSelling(selling.filter((_, i) => i !== index));
        }
    }

    
    const stackedQueue = (() => {
        const result: (SteamItem & { quantity: number })[] = [];
        const commodityMap = new Map<string, SteamItem & { quantity: number }>();

        for (const item of selling) {
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

        return result;
    })();
    function defaultPrice(item: SteamItem & { quantity: number }): string {
        const livePrice = parseFloat((livePrices.get(item.market_name) ?? item.price).toFixed(2));
        return (livePrice * 0.80).toFixed(2);
    }

    const totalValue = stackedQueue.reduce((sum, item) => {
        const price = parseFloat(priceMap[item.market_name] ?? defaultPrice(item));
        return sum + (isNaN(price) ? 0 : price) * item.quantity;
    }, 0);

    const totalItems = stackedQueue.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <>
            {showPrompt && (
                <ListPrompt totalValue={totalValue} itemCount={totalItems} onConfirm={listItems} setShowPrompt={setShowPrompt} />
            )}

            {/* Mobile: full-screen queue modal */}
            {mobileQueueOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-secondary px-4 pt-4 pb-4">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <p className="text-xl">{totalItems} Items: ${totalValue.toFixed(2)}</p>
                        <button onClick={() => setMobileQueueOpen(false)} className="text-2xl px-2">✕</button>
                    </div>
                    <div className="overflow-y-auto flex-1 space-y-3">
                        {stackedQueue.map((item) => (
                            <SellItemCard
                                key={item.market_name}
                                market_name={item.market_name}
                                quantity={item.quantity}
                                icon={item.icon}
                                hexColor={item.hexColor}
                                priceStr={priceMap[item.market_name] ?? defaultPrice(item)}
                                setPriceStr={(val) => setPriceMap(prev => ({ ...prev, [item.market_name]: val }))}
                                marketPrice={parseFloat((livePrices.get(item.market_name) ?? item.price).toFixed(2))}
                                remove={() => remove(item.market_name)}
                            />
                        ))}
                    </div>
                    <button
                        className="bg-special h-12 w-full mt-4 rounded-sm button shrink-0"
                        onClick={() => { setMobileQueueOpen(false); setShowPrompt(true); }}
                    >
                        SELL ITEMS
                    </button>
                </div>
            )}

            {/* Mobile: bottom bar shown when items queued */}
            {selling.length > 0 && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-secondary border-t border-gray-700 flex items-center px-4 h-16 gap-3">
                    <p className="flex-1 text-sm">{totalItems} item{totalItems !== 1 ? 's' : ''} · ${totalValue.toFixed(2)}</p>
                    <button onClick={() => setMobileQueueOpen(true)} className="bg-accent px-4 h-9 rounded-sm button text-sm">
                        View Queue
                    </button>
                    <button onClick={() => setShowPrompt(true)} className="bg-special px-4 h-9 rounded-sm button text-sm">
                        List
                    </button>
                </div>
            )}

            {/* Desktop: right sidebar */}
            <div className="hidden md:flex fixed w-[95%] left-[2.5%] justify-end">
                <div className="mt-20 overflow-y-auto overflow-x-hidden h-185 w-95 bg-secondary absolute rounded-sm">
                    {stackedQueue.length > 0 && (
                        <>
                        <div className="w-full flex ml-2 mt-2">
                            <p className="text-3xl">
                                {stackedQueue.length} Items: ${totalValue.toFixed(2)}
                            </p>
                        </div>

                        <div className="mx-2 mt-3 mb-1 bg-accent rounded-sm p-3 flex flex-col gap-2">
                            <p className="text-xs opacity-40">Global discount modifiers</p>
                            <div className="flex gap-1">
                                {[0, 10, 20, 30, 40].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => {
                                            const next: Record<string, string> = {};
                                            for (const item of stackedQueue) {
                                                const base = parseFloat((livePrices.get(item.market_name) ?? item.price).toFixed(2));
                                                next[item.market_name] = (base * (1 - d / 100)).toFixed(2);
                                            }
                                            setPriceMap(next);
                                        }}
                                        className="flex-1 h-7 rounded-sm text-xs cursor-pointer bg-primary opacity-60 hover:opacity-100 transition-colors"
                                    >
                                        {d === 0 ? '0%' : `-${d}%`}
                                    </button>
                                ))}
                            </div>
                        </div>
                        </>
                    )}

                    <div className="flex flex-col pb-2">
                        {stackedQueue.map((item) => (
                            <SellItemCard
                                key={item.market_name}
                                market_name={item.market_name}
                                quantity={item.quantity}
                                icon={item.icon}
                                hexColor={item.hexColor}
                                priceStr={priceMap[item.market_name] ?? defaultPrice(item)}
                                setPriceStr={(val) => setPriceMap(prev => ({ ...prev, [item.market_name]: val }))}
                                marketPrice={parseFloat((livePrices.get(item.market_name) ?? item.price).toFixed(2))}
                                remove={() => remove(item.market_name)}
                            />
                        ))}
                    </div>
                </div>

                <button
                    className={`mt-210 rounded-sm transition-all overflow-y-auto h-20 w-95 ${stackedQueue.length > 0 ? "bg-special" : "bg-accent"} absolute flex justify-center items-center cursor-pointer`}
                    onClick={() => setShowPrompt(true)}
                >
                    SELL ITEMS
                </button>
            </div>
        </>
    )
}
