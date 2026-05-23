"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import LeftPanel from "./LeftPanel";
import { getBasket, saveBasket, BasketItem } from "@/lib/basket";

//

type GameFilter = "all" | "CS2" | "Dota2" | "Rust"

export type ListingCard = {
    id: string,
    marketName: string,
    price: number,
    icon: string,
    hexColor: string,
    game: string,
    commodity: boolean,
}

type DisplayCard = ListingCard & { quantity: number }

function ListingCard({ marketName, price, icon, hexColor, quantity, onBuy }: DisplayCard & { onBuy: () => void }) {
    const [added, setAdded] = useState(false);

    function handleBuy() {
        onBuy();
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    }

    return (
        <div className="bg-accent h-50 w-49 rounded-sm relative">
            <div className="flex justify-between mt-2 pl-2 pr-2 w-full absolute z-2">
                <h1 style={{ color: `#${hexColor}` }} className="text-[14px] w-35">
                    {marketName}
                </h1>
                {quantity > 1 && (
                    <h1 className="text-[14px]">[x{quantity}]</h1>
                )}
            </div>

            <div className="absolute inset-0 flex justify-center items-center z-0 mb-5" style={{ filter: `drop-shadow(0 0 8px #${hexColor}99)` }}>
                <Image
                    src={icon}
                    alt="Failed To Load"
                    style={{ width: 'auto' }}
                    width={100}
                    height={100}
                />
            </div>

            <p className="text-[15px] pl-2 absolute bottom-10 z-2">
                ${price.toFixed(2)}
            </p>

            <div className="flex justify-center bottom-0 w-full absolute">
                <button
                    onClick={handleBuy}
                    className={`button rounded-sm w-full h-10 ${added ? "bg-special" : "bg-less-special"}`}
                    style={!added && hexColor !== 'b0c3d9' ? { borderTop: `2px solid #${hexColor}` } : {}}
                >
                    {added ? "ADDED" : "BUY"}
                </button>
            </div>
        </div>
    );
}


export default function HomeClient({ initialListings, initialHasMore }: {
    initialListings: ListingCard[],
    initialHasMore: boolean,
}) {
    const [gameFilter, setGameFilter] = useState<GameFilter>("all");
    const [listings, setListings] = useState<ListingCard[]>(initialListings);
    const [cursor, setCursor] = useState<string | null>(initialListings.at(-1)?.id ?? null);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const loadingRef = useRef(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const isFirstRender = useRef(true);

    const load = useCallback(async (game: GameFilter, cur: string | null, reset: boolean) => {
        if (loadingRef.current) return;
        loadingRef.current = true;

        const params = new URLSearchParams();
        if (game !== "all") params.set("game", game);
        if (cur) params.set("cursor", cur);

        const res = await fetch(`/api/listings?${params}`);
        const data = await res.json();

        if (reset) {
            setListings(data.listings);
        } else {
            setListings(prev => [...prev, ...data.listings]);
        }
        setCursor(data.nextCursor);
        setHasMore(data.nextCursor !== null);

        loadingRef.current = false;
    }, []);

    // On filter change, reset and fetch (skip initial mount — server data already loaded)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        load(gameFilter, null, true);
    }, [gameFilter, load]);

    // Infinite scroll via IntersectionObserver
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && hasMore) {
                load(gameFilter, cursor, false);
            }
        }, { threshold: 0.1 });

        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, cursor, gameFilter, load]);

    function handleBuy(item: DisplayCard) {
        const basket = getBasket();
        if (item.commodity) {
            const existing = basket.find(b => b.marketName === item.marketName && b.commodity);
            if (existing) {
                if (existing.quantity < item.quantity) {
                    existing.quantity += 1;
                    saveBasket(basket);
                }
            } else {
                saveBasket([...basket, { id: item.id, marketName: item.marketName, price: item.price, icon: item.icon, hexColor: item.hexColor, commodity: true, quantity: 1, maxQuantity: item.quantity } as BasketItem]);
            }
        } else {
            if (!basket.find(b => b.id === item.id)) {
                saveBasket([...basket, { id: item.id, marketName: item.marketName, price: item.price, icon: item.icon, hexColor: item.hexColor, commodity: false, quantity: 1, maxQuantity: 1 } as BasketItem]);
            }
        }
    }

    const displayListings = useMemo<DisplayCard[]>(() => {
        const result: DisplayCard[] = [];
        const commodityMap = new Map<string, DisplayCard>();

        for (const l of listings) {
            if (l.commodity) {
                const existing = commodityMap.get(l.marketName);
                if (existing) {
                    existing.quantity += 1;
                } else {
                    const entry: DisplayCard = { ...l, quantity: 1 };
                    commodityMap.set(l.marketName, entry);
                    result.push(entry);
                }
            } else {
                result.push({ ...l, quantity: 1 });
            }
        }

        return result;
    }, [listings]);

    return (
        <>
            <LeftPanel gameFilter={gameFilter} setGameFilter={setGameFilter} />

            <div className="h-full w-full flex justify-center items-center">
                <div className="bg-secondary w-200 h-150 flex justify-center items-center">
                    <div>
                        <div className="bg-secondary w-310 mr-30 overflow-y-auto h-210 mt-14 grid grid-cols-7 justify-start content-start gap-2 p-3">
                            {displayListings.map(l => (
                                <ListingCard key={l.id} {...l} onBuy={() => handleBuy(l)} />
                            ))}
                            <div ref={sentinelRef} className="col-span-7 h-1" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
