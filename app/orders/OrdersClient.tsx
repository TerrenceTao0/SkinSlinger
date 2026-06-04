"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

//

type Purchase = {
    id: string;
    createdAt: Date;
    status: string;
    price: number;
    marketName: string;
    icon: string | null;
    hexColor: string | null;
    commodity: boolean;
    buyerTradeUrl: string | null;
    buyerId: string;
    sellerId: string;
    buyer: { username: string | null; email: string | null; steam_trade_url: string | null };
    seller: { username: string | null; email: string | null };
};

type PurchaseGroup = {
    ids: string[];
    marketName: string;
    icon: string | null;
    hexColor: string | null;
    commodity: boolean;
    totalPrice: number;
    status: string;
    buyerTradeUrl: string | null;
    buyerId: string;
    sellerId: string;
    buyer: Purchase["buyer"];
    seller: Purchase["seller"];
};

function groupPurchases(purchases: Purchase[]): PurchaseGroup[] {
    const map = new Map<string, PurchaseGroup>();
    for (const p of purchases) {
        const key = p.commodity ? `${p.marketName}|${p.status}|${p.buyerId}|${p.sellerId}` : p.id;
        const existing = map.get(key);
        if (existing) {
            existing.ids.push(p.id);
            existing.totalPrice += p.price;
        } else {
            map.set(key, {
                ids: [p.id],
                marketName: p.marketName,
                icon: p.icon,
                hexColor: p.hexColor,
                commodity: p.commodity,
                totalPrice: p.price,
                status: p.status,
                buyerTradeUrl: p.buyerTradeUrl,
                buyerId: p.buyerId,
                sellerId: p.sellerId,
                buyer: p.buyer,
                seller: p.seller,
            });
        }
    }
    return [...map.values()];
}

//

function CancelModal({ refundMessage, onConfirm, onClose, loading }: {
    refundMessage: string
    onConfirm: () => void
    onClose: () => void
    loading: boolean
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-secondary rounded-sm p-8 flex flex-col gap-4 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                <p className="text-lg font-medium">Cancel order?</p>
                <p className="text-sm opacity-60">{refundMessage}</p>
                <p className="text-sm opacity-60">If the trade has already gone through, it will be detected and marked complete instead - use this to complete trades faster.</p>
                <div className="flex gap-3">
                    <button onClick={onConfirm} disabled={loading} className="h-9 px-4 rounded-sm bg-remove button flex-1">
                        {loading ? "..." : "Yes, cancel"}
                    </button>
                    <button onClick={onClose} disabled={loading} className="h-9 px-4 rounded-sm bg-accent button flex-1">
                        Go back
                    </button>
                </div>
            </div>
        </div>
    )
}

//

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    pending:   { label: "Awaiting trade offer", color: "text-yellow-400" },
    completed: { label: "Completed",            color: "text-special"   },
};

//

function PurchaseRow({ group }: { group: PurchaseGroup }) {
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const isActive = group.status === "pending";
    const { label, color } = STATUS_LABEL[group.status] ?? { label: group.status, color: "" };
    const sellerName = group.seller.username ?? group.seller.email ?? "Seller";

    async function cancel() {
        setLoading(true);
        setError("");
        for (const id of group.ids) {
            const res = await fetch(`/api/purchase/${id}/cancel`, { method: "POST" });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? "Something went wrong");
                setLoading(false);
                return;
            }
        }
        router.refresh();
        setLoading(false);
    }

    return (
        <div className="bg-accent rounded-sm p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {group.icon && (
                        <div className="relative shrink-0 w-12 h-12">
                            <Image src={group.icon} alt={group.marketName} fill className="object-contain" />
                            {group.commodity && group.ids.length > 1 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-xs px-1 rounded-sm leading-5">
                                    x{group.ids.length}
                                </span>
                            )}
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="font-medium truncate">{group.marketName}</p>
                        <p className="text-sm opacity-60">from {sellerName}</p>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="font-medium">${group.totalPrice.toFixed(2)}</p>
                    <p className={`text-sm ${color}`}>{label}</p>
                </div>
            </div>

            {isActive && (
                <div className="flex flex-col gap-2 text-sm">
                    <p className="opacity-60">Seller taking too long to send the trade offer?</p>
                    <button onClick={() => setConfirming(true)} className="h-9 px-4 rounded-sm bg-remove button w-fit">
                        Cancel
                    </button>
                    {error && <p className="text-red-400">{error}</p>}

                    {confirming && (
                        <CancelModal
                            refundMessage="Your funds will be refunded to your balance."
                            onConfirm={cancel}
                            onClose={() => setConfirming(false)}
                            loading={loading}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

//

function SaleRow({ group }: { group: PurchaseGroup }) {
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { label, color } = STATUS_LABEL[group.status] ?? { label: group.status, color: "" };
    const buyerName = group.buyer.username ?? group.buyer.email ?? "Buyer";
    const isActive = group.status === "pending";

    async function cancel() {
        setLoading(true);
        setError("");
        for (const id of group.ids) {
            const res = await fetch(`/api/purchase/${id}/cancel`, { method: "POST" });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? "Something went wrong");
                setLoading(false);
                return;
            }
        }
        router.refresh();
        setLoading(false);
    }

    return (
        <div className="bg-accent rounded-sm p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {group.icon && (
                        <div className="relative shrink-0 w-12 h-12">
                            <Image src={group.icon} alt={group.marketName} fill className="object-contain" />
                            {group.commodity && group.ids.length > 1 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-xs px-1 rounded-sm leading-5">
                                    x{group.ids.length}
                                </span>
                            )}
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="font-medium truncate">{group.marketName}</p>
                        <p className="text-sm opacity-60">to {buyerName}</p>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="font-medium">${group.totalPrice.toFixed(2)}</p>
                    <p className={`text-sm ${color}`}>{label}</p>
                </div>
            </div>

            {isActive && (
                <div className="flex flex-col gap-2 text-sm">
                    <div className="bg-primary rounded-sm p-3">
                        <p className="opacity-60 text-xs mb-1">Buyer's trade URL</p>
                        {group.buyerTradeUrl ? (
                            <a href={group.buyerTradeUrl} target="_blank" className="text-special break-all">
                                {group.buyerTradeUrl}
                            </a>
                        ) : (
                            <p className="text-red-400">Buyer has no trade URL on file</p>
                        )}
                    </div>
                    <p className="opacity-60">Buyer taking too long to accept the trade offer?</p>
                    <button onClick={() => setConfirming(true)} className="h-9 px-4 rounded-sm bg-remove button w-fit">
                        Cancel
                    </button>
                    {error && <p className="text-red-400">{error}</p>}

                    {confirming && (
                        <CancelModal
                            refundMessage="The buyer will be refunded to their balance."
                            onConfirm={cancel}
                            onClose={() => setConfirming(false)}
                            loading={loading}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

//

function NextCheckTimer() {
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        function calc() {
            const now = Date.now();
            const next = Math.ceil(now / (5 * 60 * 1000)) * (5 * 60 * 1000);
            setSecondsLeft(Math.round((next - now) / 1000));
        }

        calc();
        const id = setInterval(calc, 1000);
        return () => clearInterval(id);
    }, []);

    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;

    return (
        <div className="flex flex-col gap-1">
            <p className="opacity-60 text-lg">Next inventory check in {m}:{s.toString().padStart(2, "0")}</p>
            <p className="opacity-40 text-sm">If the buyer has their inventory set to private, we will assume the buyer has received the items successfully.</p>
        </div>
    );
}

//

export default function OrdersClient({ purchases, currentUserId }: { purchases: Purchase[]; currentUserId: string }) {
    const myPurchases = groupPurchases(purchases.filter(p => p.buyerId === currentUserId));
    const mySales = groupPurchases(purchases.filter(p => p.sellerId === currentUserId));

    return (
        <div className="w-full flex justify-center mt-20 px-4 md:px-8">
            <div className="w-full max-w-5xl flex flex-col gap-6">
                <NextCheckTimer />
                <div className="flex flex-col md:flex-row gap-8">

                    <div className="flex-1 flex flex-col gap-3 min-h-0">
                        <p className="text-xl">Purchases</p>
                        <div className="flex flex-col gap-3 overflow-y-auto max-h-[70vh] pr-1">
                            {myPurchases.length === 0 ? (
                                <p className="opacity-40">No purchases yet.</p>
                            ) : (
                                myPurchases.map((g, i) => <PurchaseRow key={i} group={g} />)
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-3 min-h-0">
                        <p className="text-xl">Sales</p>
                        <div className="flex flex-col gap-3 overflow-y-auto max-h-[70vh] pr-1">
                            {mySales.length === 0 ? (
                                <p className="opacity-40">No sales yet.</p>
                            ) : (
                                mySales.map((g, i) => <SaleRow key={i} group={g} />)
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
