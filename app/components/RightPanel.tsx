"use client"

import { SteamItem } from '@/lib/steam';
import Image from "next/image";
import { useState } from 'react';

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


function ItemCard({market_name, price, quantity, icon, hexColor, pct, setPct, remove}: {
    market_name: string, price: number, quantity: number, icon: string, hexColor: string,
    pct: number, setPct: (val: number) => void, remove: () => void
}) {
    const adjustedPrice = price * (pct / 100);

    return (
        <div className="bg-accent h-50 w-[95%] mt-3 mb-3 ml-2.25 rounded-sm relative">
            <div className="flex justify-between mt-2 pl-2 pr-2 w-full absolute z-10">
                <h1 className="text-1xl w-30" style={{ color: `#${hexColor}` }}>
                    {market_name}
                </h1>

                <h1 className="text-1xl">
                    x{quantity}
                </h1>
            </div>

            <br></br>

            <div className="flex justify-center items-center pt-1 z-0" style={{ filter: `drop-shadow(0 0 8px #${hexColor}99)` }}>
                <Image
                    src={icon}
                    alt="Failed To Load"
                    style={{ width: 'auto'}}
                    width={100}
                    height={100}
                />
            </div>

            <div className="px-2">
                <div className="flex justify-between text-[15px] opacity-70">
                    <p>{pct.toFixed(1)}%</p>
                    <p>${adjustedPrice.toFixed(2)}</p>
                </div>

                <input
                    type="range"
                    min={60}
                    max={100}
                    step={0.1}
                    value={pct}
                    onChange={e => setPct(Number(e.target.value))}
                    className="w-full accent-special"
                />
            </div>

            <div className="flex justify-end w-full absolute bottom-0">
                <button
                    className="w-full bg-remove h-7 flex justify-center items-center cursor-pointer text-[13px] button rounded-sm"
                    onClick={remove}
                >
                    REMOVE
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
    const [pctMap, setPctMap] = useState<Record<string, number>>({});

    async function listItems() {
        const items = stackedQueue.map(item => ({
            assetId: item.assetId,
            marketName: item.market_name,
            price: item.price * ((pctMap[item.market_name] ?? 80) / 100),
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
        const pct = pctMap[item.market_name] ?? 80;
        return sum + item.price * (pct / 100) * item.quantity;
    }, 0);

    return (
        <>
            {showPrompt && (
                <ListPrompt totalValue={totalValue} itemCount={stackedQueue.length} onConfirm={listItems} setShowPrompt={setShowPrompt} />
            )}

            <div className="fixed w-[95%] left-[2.5%] flex justify-end">
                <div className="mt-20 overflow-y-auto overflow-x-hidden h-185 w-95 bg-secondary absolute">
                    {stackedQueue.length > 0 && (
                        <div className="w-full flex ml-2 mt-2">
                            <p className="text-3xl">
                                {stackedQueue.length} Items: ${totalValue.toFixed(2)}
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {stackedQueue.map((item) => (
                            <ItemCard
                                key={item.market_name}
                                market_name={item.market_name}
                                price={item.price}
                                quantity={item.quantity}
                                icon={item.icon}
                                hexColor={item.hexColor}
                                pct={pctMap[item.market_name] ?? 80}
                                setPct={(val) => setPctMap(prev => ({ ...prev, [item.market_name]: val }))}
                                remove={() => remove(item.market_name)}
                            />
                        ))}
                    </div>
                </div>

                <button
                    className={`mt-210 transition-all overflow-y-auto h-20 w-95 ${stackedQueue.length > 0 ? "bg-special" : "bg-accent"} absolute flex justify-center items-center cursor-pointer`}
                    onClick={() => setShowPrompt(true)}
                >
                    SELL ITEMS
                </button>
            </div>
        </>
    )
}
