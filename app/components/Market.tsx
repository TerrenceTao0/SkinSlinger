"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import LeftPanel from "./LeftMarketPanel";
import ListingCard from "./ListingCard";
import { BasketItem } from "@/lib/basket";
import { useBasket } from "./BasketProvider";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

//

type GameFilter = "all" | "CS2" | "Dota2" | "Rust" | "TF2"

function toSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export type ListingCard = {
    id: string,
    marketName: string,
    price: number,
    icon: string,
    hexColor: string,
    game: string,
    commodity: boolean,
    sellerId: string,
    floatValue: number | null,
    paintSeed: number | null,
    stickers: { stickerId: number; slot: number; name: string; image: string; wear: number | null }[] | null,
}

export type DisplayCard = ListingCard & { quantity: number }

//

export default function HomeClient(
    {
        initialListings,
        initialHasMore,
        currentUserId,
        hasPendingPurchase,
        initialGame,
        gameBlurb,
    }: {
        initialListings: ListingCard[],
        initialHasMore: boolean,
        currentUserId: string | null,
        hasPendingPurchase: boolean,
        initialGame?: GameFilter,
        gameBlurb?: string,
    })
    {

    const [gameFilter, setGameFilter] = useState<GameFilter>(initialGame ?? "all");
    const [listings, setListings] = useState<ListingCard[]>(initialListings);
    const [pendingNotice, setPendingNotice] = useState(false);
    const [search, setSearch] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [wear, setWear] = useState<string | null>(null);
    const [minFloat, setMinFloat] = useState("");
    const [maxFloat, setMaxFloat] = useState("");
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
    const isFirstFilterRender = useRef(true);
    const searchRef = useRef(search);
    const gameFilterRef = useRef(gameFilter);
    const minPriceRef = useRef(minPrice);
    const maxPriceRef = useRef(maxPrice);
    const wearRef = useRef(wear);
    const minFloatRef = useRef(minFloat);
    const maxFloatRef = useRef(maxFloat);

    useEffect(() => { searchRef.current = search; }, [search]);
    useEffect(() => { gameFilterRef.current = gameFilter; }, [gameFilter]);
    useEffect(() => { minPriceRef.current = minPrice; }, [minPrice]);
    useEffect(() => { maxPriceRef.current = maxPrice; }, [maxPrice]);
    useEffect(() => { wearRef.current = wear; }, [wear]);
    useEffect(() => { minFloatRef.current = minFloat; }, [minFloat]);
    useEffect(() => { maxFloatRef.current = maxFloat; }, [maxFloat]);

    const load = useCallback(async (game: GameFilter, cur: string | null, reset: boolean, search: string, minP: string, maxP: string, wearFilter: string | null, minF: string, maxF: string) => {
        if (loadingRef.current) return;

        loadingRef.current = true;

        try {
            const params = new URLSearchParams();

            if (game !== "all") params.set("game", game);
            if (cur) params.set("cursor", cur);
            if (search) params.set("search", search);
            if (minP) params.set("minPrice", minP);
            if (maxP) params.set("maxPrice", maxP);
            if (wearFilter) params.set("wear", wearFilter);
            if (minF) params.set("minFloat", minF);
            if (maxF) params.set("maxFloat", maxF);

            const res = await fetch(`/api/listings?${params}`);
            const data = await res.json();

            if (reset) {
                setListings(data.listings ?? []);
            }
            else {
                setListings(prev => [...prev, ...(data.listings ?? [])]);
            }

            setCursor(data.nextCursor);
            setHasMore(data.nextCursor !== null);
        } finally {
            loadingRef.current = false;
        }
    }, []);


    // On filter change, reset and fetch immediately (skip initial mount — server data already loaded)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        load(gameFilter, null, true, searchRef.current, minPriceRef.current, maxPriceRef.current, wearRef.current, minFloatRef.current, maxFloatRef.current);
    }, [gameFilter, load]);


    // On search change, debounce then reset and fetch (skip initial mount)
    useEffect(() => {
        if (isFirstSearchRender.current) {
            isFirstSearchRender.current = false;
            return;
        }

        const id = setTimeout(() => load(gameFilterRef.current, null, true, search, minPriceRef.current, maxPriceRef.current, wearRef.current, minFloatRef.current, maxFloatRef.current), 300);
        return () => clearTimeout(id);
    }, [search, load]);


    // On price/wear change, debounce then reset and fetch (skip initial mount)
    useEffect(() => {
        if (isFirstFilterRender.current) {
            isFirstFilterRender.current = false;
            return;
        }
        const id = setTimeout(() => load(gameFilterRef.current, null, true, searchRef.current, minPrice, maxPrice, wear, minFloat, maxFloat), 400);
        return () => clearTimeout(id);
    }, [minPrice, maxPrice, wear, minFloat, maxFloat, load]);


    // Infinite scroll via IntersectionObserver
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && hasMore) {
                load(gameFilterRef.current, cursor, false, searchRef.current, minPriceRef.current, maxPriceRef.current, wearRef.current, minFloatRef.current, maxFloatRef.current);
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

        if (!item.commodity && item.sellerId === currentUserId) return;

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

                    if (listing.price < existing.price) existing.price = listing.price;
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
            <LeftPanel
                currentGame={gameFilter}
                minPrice={minPrice} setMinPrice={setMinPrice}
                maxPrice={maxPrice} setMaxPrice={setMaxPrice}
                wear={wear} setWear={setWear}
                minFloat={minFloat} setMinFloat={setMinFloat}
                maxFloat={maxFloat} setMaxFloat={setMaxFloat}
            />

            {pendingNotice && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setPendingNotice(false)}
                >
                    <div className="bg-secondary rounded-sm p-8 flex flex-col gap-4 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                        <p className="text-lg font-medium">
                            Pending order
                        </p>

                        <p className="opacity-60 text-sm">
                            You have an active purchase in progress. You cannot add items to your basket until it is completed or cancelled.
                        </p>

                        <button onClick={() => setPendingNotice(false)} className="h-9 px-4 rounded-sm bg-accent button w-fit">
                            Dismiss
                        </button>
                    </div>
                </div>
            )}


            {/* Mobile layout */}
            <div className="md:hidden flex flex-col h-full px-[2.5%]">
                <div className="bg-secondary h-14 flex items-center px-4 shrink-0 rounded-sm">
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-accent rounded-sm h-9 w-full px-3 outline-none border border-gray-500 text-sm"
                    />
                </div>

                <div className="overflow-y-auto flex-1 bg-secondary mt-2 p-3 rounded-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 justify-start content-start">
                        {displayListings.map(listing => (
                            <ListingCard
                                key={listing.id} {...listing}
                                currentUserId={currentUserId}
                                onBuy={() => listing.commodity ? router.push(`/item/${toSlug(listing.marketName)}`) : handleBuy(listing)}
                                onPreview={() => listing.commodity ? router.push(`/item/${toSlug(listing.marketName)}`) : router.push(`/item/${toSlug(listing.marketName)}/${listing.id}`)}
                            />
                        ))}

                        <div ref={mobileSentinelRef} className="col-span-full h-1" />
                    </div>
                </div>
            </div>


            {/* Desktop layout */}
            <div className="hidden md:flex w-410 ml-58 mt-20 h-screen">
                <div className="flex-1 flex flex-col gap-2">
                    <div className="bg-secondary w-full h-13 flex items-center px-4 rounded-sm">
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-accent rounded-sm h-9 w-full px-3 outline-none border border-gray-500 text-sm"
                        />
                    </div>

                    <div className="bg-secondary w-full overflow-y-auto h-196 grid grid-cols-7 justify-start content-start gap-2 p-3 rounded-sm">
                        {displayListings.map(listing => (
                            <ListingCard
                                key={listing.id} {...listing}
                                currentUserId={currentUserId}
                                onBuy={() => listing.commodity ? router.push(`/item/${toSlug(listing.marketName)}`) : handleBuy(listing)}
                                onPreview={() => listing.commodity ? router.push(`/item/${toSlug(listing.marketName)}`) : router.push(`/item/${toSlug(listing.marketName)}/${listing.id}`)}
                            />
                        ))}

                        <div ref={sentinelRef} className="col-span-7 h-1" />
                    </div>
                </div>
            </div>
        </>
    );
}
