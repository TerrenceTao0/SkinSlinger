"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import LeftPanel from "./LeftMarketPanel";
import ListingCard from "./ListingCard";
import { BasketItem } from "@/lib/basket";
import { useBasket } from "./BasketProvider";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import FloatBar from "./FloatBar";

//

type GameFilter = "all" | "CS2" | "Dota2" | "Rust" | "TF2"

function wearLabel(f: number): string {
    if (f < 0.07) return 'FN';
    if (f < 0.15) return 'MW';
    if (f < 0.38) return 'FT';
    if (f < 0.45) return 'WW';
    return 'BS';
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

type PriceLevel = { price: number; quantity: number }
type MyBuyOrder = { id: string; price: number; quantity: number }
type OrderBookData = {
    sellOrders: PriceLevel[]
    buyOrders: PriceLevel[]
    myBuyOrders: MyBuyOrder[]
}

//

function OrderBookModal({ card, data, loading, currentUserId, hasPendingPurchase, userCash, onBuy, onClose, onOrderChanged }: {
    card: DisplayCard
    data: OrderBookData | null
    loading: boolean
    currentUserId: string | null
    hasPendingPurchase: boolean
    userCash: number
    onBuy: (price: number, qty: number) => void
    onClose: () => void
    onOrderChanged: () => void
}) {
    const [selectedSellPrice, setSelectedSellPrice] = useState<number | null>(null);
    const [sellQtyStr, setSellQtyStr] = useState("1");
    const [bidPriceStr, setBidPriceStr] = useState("");
    const [bidQtyStr, setBidQtyStr] = useState("1");
    const [placingBid, setPlacingBid] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [bidError, setBidError] = useState("");

    const sellOrders = data?.sellOrders ?? [];
    const buyOrders = data?.buyOrders ?? [];
    const myBuyOrders = data?.myBuyOrders ?? [];

    useEffect(() => {
        if (sellOrders.length > 0 && selectedSellPrice === null) {
            setSelectedSellPrice(sellOrders[0].price);
        }
    }, [sellOrders, selectedSellPrice]);

    const selectedSellLevel = sellOrders.find(l => l.price === selectedSellPrice) ?? null;
    const sellQty = Math.max(1, Math.min(parseInt(sellQtyStr) || 1, selectedSellLevel?.quantity ?? 1));
    const sellTotal = (selectedSellPrice ?? 0) * sellQty;

    const bidPrice = parseFloat(bidPriceStr);
    const bidQty = Math.max(1, parseInt(bidQtyStr) || 1);
    const bidTotal = (isNaN(bidPrice) ? 0 : bidPrice) * bidQty;
    const canAffordBid = !isNaN(bidPrice) && bidPrice > 0 && bidTotal <= userCash;

    async function placeBid() {
        if (!canAffordBid) return;
        setPlacingBid(true);
        setBidError("");
        const res = await fetch("/api/market/orders/buy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                marketName: card.marketName,
                price: bidPrice,
                quantity: bidQty,
                game: card.game,
                icon: card.icon,
                hexColor: card.hexColor,
            }),
        });
        if (!res.ok) {
            const d = await res.json();
            setBidError(d.error ?? "Failed to place order");
        } else {
            setBidPriceStr("");
            setBidQtyStr("1");
            onOrderChanged();
        }
        setPlacingBid(false);
    }

    async function cancelBid(id: string, price: number, qty: number) {
        setCancellingId(id);
        const res = await fetch(`/api/market/orders/buy/${id}`, { method: "DELETE" });
        if (res.ok) onOrderChanged();
        setCancellingId(null);
        void price; void qty;
    }

    const lowestAsk = sellOrders[0]?.price ?? null;
    const highestBid = buyOrders[0]?.price ?? null;

    const colHeader = (label: "sell" | "buy") => (
        <div className="grid grid-cols-3 text-xs text-gray-500 border-b border-gray-700 pb-1">
            <span>{label === "sell" ? "Ask" : "Bid"}</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Total</span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-secondary rounded-sm w-full mx-4 max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col"
                style={{ boxShadow: `0 0 40px #${card.hexColor}33, 0 8px 32px rgba(0,0,0,0.6)` }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-700">
                    <div style={{ filter: `drop-shadow(0 0 10px #${card.hexColor}88)` }} className="shrink-0">
                        <Image src={card.icon} alt={card.marketName} width={52} height={52} style={{ width: 'auto', height: 52 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p style={{ color: `#${card.hexColor}` }} className="font-medium leading-tight truncate">{card.marketName}</p>
                        {!loading && (
                            <div className="flex gap-4 mt-1">
                                <span className="text-xs text-gray-500">Lowest ask: <span className="text-red-400 font-medium">{lowestAsk !== null ? `$${lowestAsk.toFixed(2)}` : "—"}</span></span>
                                <span className="text-xs text-gray-500">Highest bid: <span className="text-green-400 font-medium">{highestBid !== null ? `$${highestBid.toFixed(2)}` : "—"}</span></span>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none shrink-0 cursor-pointer">✕</button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12 text-gray-500 text-sm">Loading...</div>
                ) : (
                    <div className="flex flex-col gap-5 px-5 pb-5 pt-2">
                        {/* Sell Orders */}
                        <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-semibold text-gray-200">Sell Orders</h3>
                            {sellOrders.length === 0 ? (
                                <p className="text-sm text-gray-500">No listings available.</p>
                            ) : (
                                <>
                                    {colHeader("sell")}
                                    <div className="flex flex-col max-h-40 overflow-y-auto">
                                        {sellOrders.map(level => (
                                            <button
                                                key={level.price}
                                                onClick={() => { setSelectedSellPrice(level.price); setSellQtyStr("1"); }}
                                                className={`grid grid-cols-3 px-2 py-2 text-sm transition-colors cursor-pointer rounded-sm ${
                                                    selectedSellPrice === level.price
                                                        ? "bg-red-950/70 border border-red-800/60"
                                                        : "bg-red-950/30 hover:bg-red-950/50"
                                                }`}
                                            >
                                                <span className="text-left">${level.price.toFixed(2)}</span>
                                                <span className="text-center text-gray-400">{level.quantity}</span>
                                                <span className="text-right text-gray-400">${(level.price * level.quantity).toFixed(2)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Buy Orders */}
                        <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-semibold text-gray-200">Buy Orders</h3>
                            {buyOrders.length === 0 ? (
                                <p className="text-sm text-gray-500">No buy orders yet.</p>
                            ) : (
                                <>
                                    {colHeader("buy")}
                                    <div className="flex flex-col max-h-40 overflow-y-auto">
                                        {buyOrders.map(level => (
                                            <div key={level.price} className="grid grid-cols-3 px-2 py-2 text-sm rounded-sm bg-green-950/30 border border-green-800/60">
                                                <span className="text-left">${level.price.toFixed(2)}</span>
                                                <span className="text-center text-gray-400">{level.quantity}</span>
                                                <span className="text-right text-gray-400">${(level.price * level.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                            {currentUserId && myBuyOrders.length > 0 && (
                                <div className="flex flex-col gap-1 mt-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Your orders</p>
                                    {myBuyOrders.map(order => (
                                        <div key={order.id} className="flex items-center gap-2 px-2 py-2 bg-accent rounded-sm text-sm">
                                            <span className="text-green-400 font-medium">${order.price.toFixed(2)}</span>
                                            <span className="text-gray-400">×{order.quantity}</span>
                                            <span className="text-gray-500 flex-1">${(order.price * order.quantity).toFixed(2)} held</span>
                                            <button
                                                onClick={() => cancelBid(order.id, order.price, order.quantity)}
                                                disabled={cancellingId === order.id}
                                                className="text-xs text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                                            >
                                                {cancellingId === order.id ? "..." : "Cancel"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {currentUserId && (
                            <>
                                <div className="border-t border-gray-700" />

                                {/* Place Buy Order */}
                                <div className="flex flex-col gap-3">
                                    <h3 className="text-sm font-semibold text-gray-200">Place Buy Order</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-500">Price (USD)</label>
                                            <input
                                                type="number" min={0.01} step={0.01} placeholder="0.00"
                                                value={bidPriceStr}
                                                onChange={e => setBidPriceStr(e.target.value)}
                                                className="bg-accent rounded-sm h-9 px-3 outline-none border border-gray-600 text-sm w-full"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-500">Quantity</label>
                                            <input
                                                type="number" min={1} placeholder="1"
                                                value={bidQtyStr}
                                                onChange={e => setBidQtyStr(e.target.value)}
                                                className="bg-accent rounded-sm h-9 px-3 outline-none border border-gray-600 text-sm w-full"
                                            />
                                        </div>
                                    </div>
                                    {bidTotal > 0 && <p className="text-sm text-gray-300">Total held: <span className="font-medium">${bidTotal.toFixed(2)}</span></p>}
                                    {bidTotal > 0 && !canAffordBid && <p className="text-red-400 text-sm">Insufficient balance — you have ${userCash.toFixed(2)}</p>}
                                    {bidError && <p className="text-red-400 text-sm">{bidError}</p>}
                                    <button
                                        onClick={placeBid}
                                        disabled={!canAffordBid || placingBid || !bidPriceStr}
                                        className={`h-9 rounded-sm text-sm font-medium w-full ${canAffordBid && bidPriceStr ? "bg-special button" : "bg-accent text-gray-500 cursor-not-allowed"}`}
                                    >
                                        {placingBid ? "Placing..." : "Place Buy Order"}
                                    </button>
                                </div>

                                <div className="border-t border-gray-700" />
                            </>
                        )}

                        {/* Buy Instantly */}
                        {currentUserId === card.sellerId ? null : selectedSellLevel ? (
                            <div className="flex flex-col gap-3">
                                <h3 className="text-sm font-semibold text-gray-200">Buy Instantly</h3>
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col gap-1 flex-1">
                                        <label className="text-xs text-gray-500">Quantity (max {selectedSellLevel.quantity})</label>
                                        <input
                                            type="number" min={1} max={selectedSellLevel.quantity}
                                            value={sellQtyStr}
                                            onChange={e => setSellQtyStr(e.target.value)}
                                            className="bg-accent rounded-sm h-9 px-3 outline-none border border-gray-600 text-sm w-full"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 shrink-0 text-right">
                                        <span className="text-xs text-gray-500">Total</span>
                                        <span className="text-sm font-medium text-gray-200 h-9 flex items-center justify-end">${sellTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { onBuy(selectedSellPrice!, sellQty); onClose(); }}
                                    disabled={hasPendingPurchase}
                                    className="h-9 rounded-sm bg-special button text-sm font-medium w-full"
                                >
                                    Add to Basket — ${sellTotal.toFixed(2)}
                                </button>
                            </div>
                        ) : sellOrders.length > 0 ? (
                            <p className="text-sm text-gray-500">Select a price above to buy instantly.</p>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}

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
    const [preview, setPreview] = useState<DisplayCard | null>(null);
    const [previewQtyStr, setPreviewQtyStr] = useState("");
    const [pendingNotice, setPendingNotice] = useState(false);
    const previewQty = parseInt(previewQtyStr) || 1;
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

    const [orderBookCard, setOrderBookCard] = useState<DisplayCard | null>(null);
    const [orderBookData, setOrderBookData] = useState<OrderBookData | null>(null);
    const [orderBookLoading, setOrderBookLoading] = useState(false);

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


    async function openOrderBook(card: DisplayCard) {
        setOrderBookCard(card);
        setOrderBookData(null);
        setOrderBookLoading(true);
        const res = await fetch(`/api/market/orders?marketName=${encodeURIComponent(card.marketName)}`);
        const data = await res.json();
        setOrderBookData({ sellOrders: data.sellOrders ?? [], buyOrders: data.buyOrders ?? [], myBuyOrders: data.myBuyOrders ?? [] });
        setOrderBookLoading(false);
    }

    async function refreshOrderBook() {
        if (!orderBookCard) return;
        const res = await fetch(`/api/market/orders?marketName=${encodeURIComponent(orderBookCard.marketName)}`);
        const data = await res.json();
        setOrderBookData({ sellOrders: data.sellOrders ?? [], buyOrders: data.buyOrders ?? [], myBuyOrders: data.myBuyOrders ?? [] });
    }

    function closeOrderBook() {
        setOrderBookCard(null);
        setOrderBookData(null);
    }


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

    function handleBuyFromOrderBook(price: number, qty: number) {
        if (!orderBookCard || !orderBookData) return;
        const level = orderBookData.sellOrders.find(l => l.price === price);
        if (!level) return;
        handleBuy({ ...orderBookCard, price, quantity: level.quantity }, qty);
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


            {/* Non-commodity preview modal */}
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
                            <span className="opacity-60">
                                Listing Price
                            </span>

                            <span>
                                ${(preview.price * previewQty).toFixed(2)}
                            </span>
                        </div>

                        {preview.floatValue !== null && (
                            <div className="flex flex-col gap-1.5 w-full">
                                <div className="flex justify-between text-sm">
                                    <span className="opacity-60">
                                        Float
                                    </span>

                                    <span className="font-mono">
                                        {wearLabel(preview.floatValue)} · {preview.floatValue.toFixed(10).replace(/0+$/, '')}
                                    </span>
                                </div>

                                <FloatBar value={preview.floatValue} />
                            </div>
                        )}

                        {preview.paintSeed !== null && (
                            <div className="flex justify-between w-full text-sm">
                                <span className="opacity-60">
                                    Pattern
                                </span>

                                <span>
                                    #{preview.paintSeed}
                                </span>
                            </div>
                        )}

                        {preview.stickers && preview.stickers.length > 0 && (
                            <div className="flex flex-col gap-1 w-full">
                                <span className="opacity-60 text-sm">
                                    Stickers
                                </span>

                                <div className="flex gap-2 flex-wrap">
                                    {preview.stickers.map((s, i) => (
                                        <div key={i} className="flex flex-col items-center gap-0.5" title={s.name}>
                                            <Image src={s.image} alt={s.name} width={40} height={40} style={{ width: 'auto', height: 40 }} />

                                            <span className="text-[10px] opacity-40 text-center max-w-10 truncate">
                                                {s.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
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


            {/* Commodity order book modal */}
            {orderBookCard && (
                <OrderBookModal
                    card={orderBookCard}
                    data={orderBookData}
                    loading={orderBookLoading}
                    currentUserId={currentUserId}
                    hasPendingPurchase={hasPendingPurchase}
                    userCash={session?.user?.cash ?? 0}
                    onBuy={handleBuyFromOrderBook}
                    onClose={closeOrderBook}
                    onOrderChanged={refreshOrderBook}
                />
            )}


            {/* Mobile layout */}
            <div className="md:hidden flex flex-col h-full mt-4 px-[2.5%]">
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
                                onBuy={() => listing.commodity ? openOrderBook(listing) : handleBuy(listing)}
                                onPreview={() => listing.commodity ? openOrderBook(listing) : (setPreview(listing), setPreviewQtyStr(""))}
                            />
                        ))}

                        <div ref={mobileSentinelRef} className="col-span-full h-1" />
                    </div>
                </div>
            </div>


            {/* Desktop layout (original) */}
            <div className="hidden md:flex w-410 ml-50 mt-20 h-screen">
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
                                onBuy={() => listing.commodity ? openOrderBook(listing) : handleBuy(listing)}
                                onPreview={() => listing.commodity ? openOrderBook(listing) : (setPreview(listing), setPreviewQtyStr(""))}
                            />
                        ))}

                        <div ref={sentinelRef} className="col-span-7 h-1" />
                    </div>
                </div>
            </div>
        </>
    );
}
