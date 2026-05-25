"use client"

import { SteamItem } from '@/lib/steam';
import { useState } from 'react';
import SellItemCard from './SellItemCard';

//

function ListPrompt(
        {
            totalValue,
            itemCount,
            onConfirm,
            setShowPrompt
        } :
        {
            totalValue: number
            itemCount: number
            onConfirm: () => void
            setShowPrompt: (value: boolean) => void
        }
    ) {
    return (
        <div className="w-full h-full absolute flex justify-center items-center z-5">
            {/* Blur background */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-6"
                onClick={() => setShowPrompt(false)}
            ></div>


            {/* Prompt listing */}
            <div className="w-90 h-100 bg-accent z-7 flex flex-col items-center p-6 gap-3">
                <p className="text-3xl mt-4">
                    Confirm Listing
                </p>

                <div className="w-full border-t border-white mt-2" />

                <div className="w-full flex justify-between px-2">
                    <p className="text-lg">
                        {itemCount} Items:
                    </p>

                    <p className="text-lg">
                        ${totalValue.toFixed(2)}
                    </p>
                </div>

                <div className="w-full flex justify-between px-2">
                    <p className="text-lg">
                        Fees
                    </p>

                    <p className="text-lg text-special">
                        0%
                    </p>
                </div>

                <div className="w-full border-t border-white" />

                <p className="text-ms text-center px-4 opacity-60">
                    We only apply a flat $3 fee to withdrawals.
                </p>

                <button
                    className="bg-special button w-full h-10 mt-auto animate-pulse"
                    onClick={onConfirm}
                >
                    CONFIRM
                </button>
            </div>
        </div>
    )
}

export default function RightPanel({ selling, setSelling, onListed }: {
    selling: SteamItem[],
    setSelling: React.Dispatch<React.SetStateAction<SteamItem[]>>,
    onListed: () => void
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
    const totalValue = stackedQueue.reduce((sum, item) => {
        const price = parseFloat(priceMap[item.market_name] ?? (item.price * 0.80).toFixed(2));
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
                                priceStr={priceMap[item.market_name] ?? (item.price * 0.80).toFixed(2)}
                                setPriceStr={(val) => setPriceMap(prev => ({ ...prev, [item.market_name]: val }))}
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
                        <div className="w-full flex ml-2 mt-2">
                            <p className="text-3xl">
                                {stackedQueue.length} Items: ${totalValue.toFixed(2)}
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {stackedQueue.map((item) => (
                            <SellItemCard
                                key={item.market_name}
                                market_name={item.market_name}
                                quantity={item.quantity}
                                icon={item.icon}
                                hexColor={item.hexColor}
                                priceStr={priceMap[item.market_name] ?? (item.price * 0.80).toFixed(2)}
                                setPriceStr={(val) => setPriceMap(prev => ({ ...prev, [item.market_name]: val }))}
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
