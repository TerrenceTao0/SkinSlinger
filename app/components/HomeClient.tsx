"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import LeftPanel from "./LeftPanel";
import { BasketItem } from "@/lib/basket";
import { useBasket } from "./BasketProvider";

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
    sellerId: string,
}

type DisplayCard = ListingCard & { quantity: number }

function ListingCard({ marketName, price, icon, hexColor, quantity, sellerId, currentUserId, onBuy }: DisplayCard & { currentUserId: string | null, onBuy: () => void }) {
    const isOwned = currentUserId !== null && currentUserId === sellerId;

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


export default function HomeClient({ initialListings, initialHasMore, currentUserId }: {
    initialListings: ListingCard[],
    initialHasMore: boolean,
    currentUserId: string | null,
}) {
    const [gameFilter, setGameFilter] = useState<GameFilter>("all");
    const [listings, setListings] = useState<ListingCard[]>(initialListings);
    const { basket, setBasket } = useBasket();
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
        const current = basket;
        let updated: BasketItem[];

        if (item.commodity) {
            const existing = current.find(b => b.marketName === item.marketName && b.commodity);
            if (existing) {
                if (existing.quantity >= existing.maxQuantity) return;
                updated = current.map(b =>
                    b.marketName === item.marketName && b.commodity ? { ...b, quantity: b.quantity + 1 } : b
                );
            } else {
                updated = [...current, { id: item.id, marketName: item.marketName, price: item.price, icon: item.icon, hexColor: item.hexColor, commodity: true, quantity: 1, maxQuantity: item.quantity } as BasketItem];
            }
        } else {
            if (current.find(b => b.id === item.id)) return;
            updated = [...current, { id: item.id, marketName: item.marketName, price: item.price, icon: item.icon, hexColor: item.hexColor, commodity: false, quantity: 1, maxQuantity: 1 } as BasketItem];
        }

        setBasket(updated);
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

        // Subtract basket quantities; hide fully-basketed items
        return result
            .map(item => {
                if (item.commodity) {
                    const inBasket = basket.find(b => b.marketName === item.marketName && b.commodity);
                    return inBasket ? { ...item, quantity: item.quantity - inBasket.quantity } : item;
                }
                return item;
            })
            .filter(item => !item.commodity
                ? !basket.find(b => b.id === item.id)
                : item.quantity > 0
            );
    }, [listings, basket]);

    return (
        <>
            <LeftPanel gameFilter={gameFilter} setGameFilter={setGameFilter} />

            <div className="h-full w-full flex justify-center items-center">
                <div className="bg-secondary w-200 h-150 flex justify-center items-center">
                    <div>
                        <div className="bg-secondary w-310 mr-30 overflow-y-auto h-210 mt-14 grid grid-cols-7 justify-start content-start gap-50 p-3">
                            {displayListings.map(l => (
                                <ListingCard key={l.id} {...l} currentUserId={currentUserId} onBuy={() => handleBuy(l)} />
                            ))}
                            
                            <div ref={sentinelRef} className="col-span-7 h-1" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
