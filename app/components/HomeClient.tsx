"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import LeftPanel from "./LeftPanel";
import ListingCard from "./ListingCard";
import { BasketItem } from "@/lib/basket";
import { useBasket } from "./BasketProvider";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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

export type DisplayCard = ListingCard & { quantity: number }

//

export default function HomeClient(
    {
        initialListings,
        initialHasMore,
        currentUserId,
        hasPendingPurchase,
    }: {
        initialListings: ListingCard[],
        initialHasMore: boolean,
        currentUserId: string | null,
        hasPendingPurchase: boolean,
    })
    {

    const [gameFilter, setGameFilter] = useState<GameFilter>("all");
    const [listings, setListings] = useState<ListingCard[]>(initialListings);
    const [preview, setPreview] = useState<DisplayCard | null>(null);
    const [previewQtyStr, setPreviewQtyStr] = useState("");
    const [pendingNotice, setPendingNotice] = useState(false);
    const previewQty = parseInt(previewQtyStr) || 1;
    const [search, setSearch] = useState("");
    const { basket, setBasket } = useBasket();
    const [cursor, setCursor] = useState<string | null>(initialListings.at(-1)?.id ?? null);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const { data: session } = useSession();

    const router = useRouter();

    const loadingRef = useRef(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const mobileSentinelRef = useRef<HTMLDivElement>(null);
    const isFirstRender = useRef(true);
    const isFirstSearchRender = useRef(true);
    const searchRef = useRef(search);
    const gameFilterRef = useRef(gameFilter);

    useEffect(() => { searchRef.current = search; }, [search]);
    useEffect(() => { gameFilterRef.current = gameFilter; }, [gameFilter]);

    const load = useCallback(async (game: GameFilter, cur: string | null, reset: boolean, search: string) => {
        if (loadingRef.current) return;

        loadingRef.current = true;

        const params = new URLSearchParams();

        if (game !== "all") params.set("game", game);
        if (cur) params.set("cursor", cur);
        if (search) params.set("search", search);

        const res = await fetch(`/api/listings?${params}`);
        const data = await res.json();

        if (reset) {
            setListings(data.listings);
        }
        else {
            setListings(prev => [...prev, ...data.listings]);
        }


        setCursor(data.nextCursor);
        setHasMore(data.nextCursor !== null);

        loadingRef.current = false;
    }, []);


    // On filter change, reset and fetch immediately (skip initial mount — server data already loaded)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        load(gameFilter, null, true, searchRef.current);
    }, [gameFilter, load]);


    // On search change, debounce then reset and fetch (skip initial mount)
    useEffect(() => {
        if (isFirstSearchRender.current) {
            isFirstSearchRender.current = false;
            return;
        }

        const id = setTimeout(() => load(gameFilterRef.current, null, true, search), 300);
        return () => clearTimeout(id);
    }, [search, load]);


    // Infinite scroll via IntersectionObserver
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && hasMore) {
                load(gameFilterRef.current, cursor, false, searchRef.current);
            }
        }, { threshold: 0.1 });

        if (sentinelRef.current) observer.observe(sentinelRef.current);
        if (mobileSentinelRef.current) observer.observe(mobileSentinelRef.current);

        return () => observer.disconnect();
    }, [hasMore, cursor, gameFilter, load]);


    function handleBuy(item: DisplayCard, qty: number = 1) {
        if (session === null) {
            router.push("/sign-up");
            return;
        }

        if (hasPendingPurchase) {
            setPendingNotice(true);
            return;
        }


        const current = basket;
        let updated: BasketItem[];

        if (item.commodity) {
            const existing = current.find(b => b.marketName === item.marketName && b.commodity);

            if (existing) {
                const newQty = Math.min(existing.quantity + qty, existing.maxQuantity);
                if (newQty === existing.quantity) return;

                updated = current.map(b =>
                    b.marketName === item.marketName && b.commodity ? { ...b, quantity: newQty } : b
                );
            }
            else {
                updated = [...current, { id: item.id, marketName: item.marketName, price: item.price, icon: item.icon, hexColor: item.hexColor, commodity: true, quantity: qty, maxQuantity: item.quantity } as BasketItem];
            }
        }
        else {
            if (current.find(b => b.id === item.id)) return;

            updated = [...current, { id: item.id, marketName: item.marketName, price: item.price, icon: item.icon, hexColor: item.hexColor, commodity: false, quantity: 1, maxQuantity: 1 } as BasketItem];
        }


        setBasket(updated);
    }


    const displayListings = useMemo<DisplayCard[]>(() => {
        const result: DisplayCard[] = [];
        const commodityMap = new Map<string, DisplayCard>();

        for (const listing of listings) {
            if (listing.commodity) {
                const existing = commodityMap.get(listing.marketName);

                if (existing) {
                    existing.quantity += 1;
                }
                else {
                    const entry: DisplayCard = { ...listing, quantity: 1 };
                    commodityMap.set(listing.marketName, entry);
                    result.push(entry);
                }
            }
            else {
                result.push({ ...listing, quantity: 1 });
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
            )
            .sort((a, b) => {
                if (b.price !== a.price) return b.price - a.price;
                return b.quantity - a.quantity;
            });
    }, [listings, basket]);


    return (
        <>
            <LeftPanel gameFilter={gameFilter} setGameFilter={setGameFilter} />

            {pendingNotice && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setPendingNotice(false)}
                >
                    <div className="bg-secondary rounded-sm p-8 flex flex-col gap-4 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                        <p className="text-lg font-medium">Pending order</p>
                        <p className="opacity-60 text-sm">You have an active purchase in progress. You cannot add items to your basket until it is completed or cancelled.</p>
                        <button onClick={() => setPendingNotice(false)} className="h-9 px-4 rounded-sm bg-accent button w-fit">Dismiss</button>
                    </div>
                </div>
            )}

            {preview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setPreview(null)}
                >
                    <div
                        className="bg-secondary rounded-sm p-8 flex flex-col items-center gap-4 w-80"
                        style={{ boxShadow: `0 0 40px #${preview.hexColor}55, 0 8px 32px rgba(0,0,0,0.6)` }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ filter: `drop-shadow(0 0 16px #${preview.hexColor}99)` }}>
                            <Image
                                src={preview.icon}
                                alt={preview.marketName}
                                width={180}
                                height={180}
                                style={{ width: 'auto' }}
                            />
                        </div>

                        <h2 style={{ color: `#${preview.hexColor}` }} className="text-lg text-center">
                            {preview.marketName}
                        </h2>

                        <div className="flex justify-between w-full text-sm">
                            <span className="opacity-60">Listing Price</span>
                            <span>${(preview.price * previewQty).toFixed(2)}</span>
                        </div>

                        {preview.quantity > 1 && (
                            <div className="flex justify-between w-full text-sm">
                                <span className="opacity-60">Available</span>
                                <span>{preview.quantity}</span>
                            </div>
                        )}

                        {preview.commodity && preview.quantity > 1 && (
                            <div className="flex justify-between items-center w-full text-sm">
                                <span className="opacity-60">Quantity</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={preview.quantity}
                                    value={previewQtyStr}
                                    placeholder="1"
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (val === "") {
                                            setPreviewQtyStr("");
                                        } else {
                                            const num = parseInt(val);
                                            if (!isNaN(num)) setPreviewQtyStr(String(Math.min(Math.max(1, num), preview.quantity)));
                                        }
                                    }}
                                    className="bg-accent rounded-sm w-16 h-8 text-center outline-none border border-gray-500"
                                />
                            </div>
                        )}

                        <button
                            onClick={() => { handleBuy(preview, previewQty); setPreview(null); }}
                            disabled={currentUserId !== null && currentUserId === preview.sellerId}
                            className={`w-full h-10 rounded-sm ${currentUserId === preview.sellerId ? "bg-accent opacity-50 cursor-default" : "bg-less-special button"}`}
                            style={preview.hexColor !== 'b0c3d9' ? { borderTop: `2px solid #${preview.hexColor}` } : {}}
                        >
                            {currentUserId === preview.sellerId ? "OWNED" : "BUY"}
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile layout */}
            <div className="md:hidden flex flex-col h-full pt-[108px]">
                <div className="bg-secondary h-14 flex items-center px-4 shrink-0">
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-accent rounded-sm h-9 w-full px-3 outline-none border border-gray-500 text-sm"
                    />
                </div>

                <div className="overflow-y-auto flex-1 bg-secondary mt-2 p-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 justify-start content-start">
                        {displayListings.map(listing => (
                            <ListingCard
                                key={listing.id} {...listing}
                                currentUserId={currentUserId}
                                onBuy={() => handleBuy(listing)}
                                onPreview={() => { setPreview(listing); setPreviewQtyStr(""); }}
                            />
                        ))}

                        <div ref={mobileSentinelRef} className="col-span-full h-1" />
                    </div>
                </div>
            </div>

            {/* Desktop layout (original) */}
            <div className="hidden md:flex h-full w-full justify-center items-center">
                <div className="bg-secondary w-200 h-150 flex justify-center items-center">
                    <div>
                        <div className="bg-secondary w-310 h-14 mt-14 absolute flex items-center px-4">
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="bg-accent rounded-sm h-9 w-full px-3 outline-none border border-gray-500 text-sm"
                            />
                        </div>

                        <div className="bg-secondary w-310 mr-30 overflow-y-auto h-196 mt-28 grid grid-cols-7 justify-start content-start gap-50 p-3">
                            {displayListings.map(listing => (
                                <ListingCard
                                    key={listing.id} {...listing}
                                    currentUserId={currentUserId}
                                    onBuy={() => handleBuy(listing)}
                                    onPreview={() => { setPreview(listing); setPreviewQtyStr(""); }}
                                />
                            ))}

                            <div ref={sentinelRef} className="col-span-7 h-1" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
