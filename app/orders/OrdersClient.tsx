"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

//

type Purchase = {
    id: string;
    createdAt: Date;
    deliveredAt: Date | null;
    status: string;
    price: number;
    marketName: string;
    icon: string | null;
    hexColor: string | null;
    commodity: boolean;
    buyerTradeUrl: string | null;
    buyerId: string;
    sellerId: string;
    buyerName: string | null;
    sellerName: string | null;
    buyerImage: string | null;
    sellerImage: string | null;
};

type PurchaseGroup = {
    ids: string[];
    createdAt: Date;
    deliveredAt: Date | null;
    marketName: string;
    icon: string | null;
    hexColor: string | null;
    commodity: boolean;
    totalPrice: number;
    status: string;
    buyerTradeUrl: string | null;
    buyerId: string;
    sellerId: string;
    buyerName: string | null;
    sellerName: string | null;
    buyerImage: string | null;
    sellerImage: string | null;
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
                createdAt: p.createdAt,
                deliveredAt: p.deliveredAt,
                marketName: p.marketName,
                icon: p.icon,
                hexColor: p.hexColor,
                commodity: p.commodity,
                totalPrice: p.price,
                status: p.status,
                buyerTradeUrl: p.buyerTradeUrl,
                buyerId: p.buyerId,
                sellerId: p.sellerId,
                buyerName: p.buyerName,
                sellerName: p.sellerName,
                buyerImage: p.buyerImage,
                sellerImage: p.sellerImage,
            });
        }
    }
    return [...map.values()];
}

//

const STATUS_CHIP: Record<string, { label: string; className: string }> = {
    pending:   { label: "In progress", className: "bg-yellow-400/10 text-yellow-400" },
    holding:   { label: "Clearing",    className: "bg-blue-400/10 text-blue-400" },
    completed: { label: "Completed",   className: "bg-special/10 text-special" },
    reversed:  { label: "Reversed",    className: "bg-red-400/10 text-red-400" },
    cancelled: { label: "Cancelled",   className: "bg-white/5 text-gray-400" },
};

function statusChip(status: string) {
    return STATUS_CHIP[status] ?? { label: status, className: "bg-white/5 text-gray-400" };
}

function formatDate(d: Date) {
    return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
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
                <p className="text-lg font-medium">
                    Cancel order?
                </p>

                <p className="text-sm opacity-60">
                    {refundMessage}
                </p>

                <p className="text-sm opacity-60">
                    If the trade has already gone through, it will be detected and marked complete instead - use this to complete trades faster.
                </p>

                <div className="flex gap-3">
                    <button onClick={onConfirm} disabled={loading} className="h-9 px-4 rounded-sm bg-negative button flex-1">
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


function useCancel(ids: string[]) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function cancel() {
        setLoading(true);
        setError("");

        for (const id of ids) {
            const res = await fetch(`/api/purchase/${id}/cancel`, { method: "POST" });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? "Something went wrong");
                setLoading(false);

                return false;
            }
        }


        router.refresh();
        setLoading(false);
        return true;
    }


    return { cancel, loading, error };
}


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
        <span className="font-mono text-gray-300">
            {m}:{s.toString().padStart(2, "0")}
        </span>
    );
}

//

function Avatar({ image, name }: { image: string | null; name: string }) {
    if (image) {
        return <Image src={image} alt={name} width={36} height={36} className="rounded-[4px] shrink-0" />;
    }
    return (
        <span className="w-9 h-9 rounded-[4px] bg-accent flex items-center justify-center text-sm font-semibold shrink-0">
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function StageTracker({ stages, currentStep }: { stages: string[]; currentStep: number }) {
    return (
        <ol className="flex flex-col gap-0">
            {stages.map((stage, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                return (
                    <li key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold
                                ${done ? "bg-special" : active ? "bg-yellow-400/15 text-yellow-400 ring-1 ring-yellow-400/50" : "bg-white/5 text-gray-500"}`}
                            >
                                {done ? "✓" : i + 1}

                            </span>
                            {i < stages.length - 1 && (
                                <span className={`w-px flex-1 my-0.5 ${done ? "bg-special/50" : "bg-gray-700/60"}`} />
                            )}
                        </div>

                        <p className={`text-sm pb-4 pt-0.5 ${done ? "text-gray-400" : active ? "text-white font-medium" : "text-gray-500"}`}>
                            {stage}
                            {active && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse align-middle" />}
                        </p>
                    </li>
                );
            })}
        </ol>
    );
}


function ActiveTradeCard({ group, role }: { group: PurchaseGroup; role: "buyer" | "seller" }) {
    const [confirming, setConfirming] = useState(false);
    const { cancel, loading, error } = useCancel(group.ids);

    const counterpartyName = role === "buyer" ? (group.sellerName ?? "Seller") : (group.buyerName ?? "Buyer");
    const counterpartyImage = role === "buyer" ? group.sellerImage : group.buyerImage;

    const stages = role === "buyer"
        ? [
            "Order placed - payment held in escrow",
            `${counterpartyName} sends you a Steam trade offer`,
            "You accept the trade on Steam",
            "Trade verified - item is yours",
        ]
        : [
            "Order received - buyer's payment held in escrow",
            `Send a Steam trade offer to ${counterpartyName}`,
            `${counterpartyName} accepts the trade on Steam`,
            "Trade verified - funds released to your balance",
        ];


    // "pending" is awaiting the trade; "holding" means delivered and clearing.
    const isHolding = group.status === "holding";
    const currentStep = isHolding ? 3 : 1;
    const releaseText = group.deliveredAt
        ? formatDate(new Date(new Date(group.deliveredAt).getTime() + 7 * 24 * 60 * 60 * 1000))
        : "soon";

    return (
        <div className="bg-secondary rounded-sm p-5 flex flex-col gap-4" style={group.hexColor ? { boxShadow: `0 0 32px #${group.hexColor}1a` } : undefined}>
            {/* Header: item + counterparty + price */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {group.icon && (
                        <div className="relative shrink-0 w-14 h-14">
                            <Image src={group.icon} alt={group.marketName} fill className="object-contain" />
                            {group.commodity && group.ids.length > 1 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-xs px-1 rounded-sm leading-5">
                                    x{group.ids.length}
                                </span>
                            )}
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="font-semibold truncate" style={group.hexColor ? { color: `#${group.hexColor}` } : undefined}>
                            {group.marketName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {role === "buyer" ? "Buying" : "Selling"} · ordered {formatDate(group.createdAt)}
                        </p>
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <p className="font-semibold text-lg [font-family:var(--font-display)]">${group.totalPrice.toFixed(2)}</p>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-sm ${statusChip(group.status).className}`}>
                        {statusChip(group.status).label}
                    </span>
                </div>
            </div>

            {/* Counterparty */}
            <div className="flex items-center gap-3 bg-primary/60 rounded-sm px-3 py-2.5">
                <Avatar image={counterpartyImage} name={counterpartyName} />
                <div className="min-w-0">
                    <p className="text-xs text-gray-500">{role === "buyer" ? "Trading with seller" : "Trading with buyer"}</p>
                    <p className="text-sm font-medium truncate">{counterpartyName}</p>
                </div>
            </div>


            {/* Stage tracker */}
            <StageTracker stages={stages} currentStep={currentStep} />


            {/* Seller action: the trade URL they need right now */}
            {role === "seller" && !isHolding && (
                <div className="bg-primary/60 rounded-sm p-3 -mt-2">
                    <p className="text-xs text-gray-500 mb-1">Send the trade offer from your Steam account to:</p>
                    {group.buyerTradeUrl ? (
                        <a href={group.buyerTradeUrl} target="_blank" rel="noopener noreferrer" className="text-special text-sm break-all underline underline-offset-2">
                            {group.buyerTradeUrl}
                        </a>
                    ) : (
                        <p className="text-negative text-sm">The buyer has no trade URL on file — they need to add one before you can send the offer.</p>
                    )}
                </div>
            )}


            {/* Footer: clearing notice while holding, otherwise verify + cancel */}
            {isHolding ? (
                <div className="border-t border-gray-700/50 pt-3 -mt-1">
                    <p className="text-xs text-gray-500">
                        {role === "seller"
                            ? <>Delivered. Funds clear to your balance around <span className="text-gray-300">{releaseText}</span>, once Steam&apos;s trade-reversal window passes.</>
                            : <>Item received. Protection period ends around <span className="text-gray-300">{releaseText}</span> — if the trade is reversed before then, you&apos;re refunded automatically.</>}
                    </p>
                </div>
            ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-700/50 pt-3 -mt-1">
                    <p className="text-xs text-gray-500">
                        Next inventory check in <NextCheckTimer /> — trades are verified automatically every 5 minutes.
                    </p>

                    <button onClick={() => setConfirming(true)} className="h-8 px-3 rounded-sm bg-negative button text-sm shrink-0">
                        Cancel order
                    </button>
                </div>
            )}

            {error && (
                <p className="text-red-400 text-sm">
                    {error}
                </p>
            )}

            {confirming && (
                <CancelModal
                    refundMessage={role === "buyer"
                        ? "Your funds will be refunded to your balance."
                        : "The buyer will be refunded to their balance."}
                    onConfirm={cancel}
                    onClose={() => setConfirming(false)}
                    loading={loading}
                />
            )}
        </div>
    );
}


function HistoryRow({ group, role }: { group: PurchaseGroup; role: "buyer" | "seller" }) {
    const counterpartyName = role === "buyer" ? (group.sellerName ?? "Seller") : (group.buyerName ?? "Buyer");
    const chip = statusChip(group.status);

    return (
        <div className="bg-accent rounded-sm px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
                {group.icon && (
                    <div className="relative shrink-0 w-10 h-10">
                        <Image src={group.icon} alt={group.marketName} fill className="object-contain" />

                        {group.commodity && group.ids.length > 1 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-[10px] px-1 rounded-sm leading-4">
                                x{group.ids.length}
                            </span>
                        )}
                    </div>
                )}

                <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                        {group.marketName}
                    </p>

                    <p className="text-xs text-gray-500 truncate">
                        {role === "buyer" ? `from ${counterpartyName}` : `to ${counterpartyName}`} · {formatDate(group.createdAt)}
                    </p>
                </div>
            </div>

            <div className="text-right shrink-0">
                <p className="text-sm font-medium">
                    ${group.totalPrice.toFixed(2)}
                </p>

                <span className={`inline-block text-xs px-1.5 py-0.5 rounded-sm ${chip.className}`}>
                    {chip.label}
                </span>
            </div>
        </div>
    );
}

//

function maskEmail(email: string) {
    const [local, domain] = email.split("@");
    if (!domain) return "*".repeat(email.length);
    const maskedLocal = local.length <= 1 ? "*" : local[0] + "*".repeat(local.length - 1);
    return `${maskedLocal}@${domain}`;
}

function EmailNotificationCard({ notificationEmail, pendingEmail }: { notificationEmail: string | null; pendingEmail: string | null }) {
    const [step, setStep] = useState<"idle" | "code" | "done">(
        notificationEmail ? "done" : pendingEmail ? "code" : "idle"
    );
    const [email, setEmail] = useState(notificationEmail ?? pendingEmail ?? "");
    const [confirmedEmail, setConfirmedEmail] = useState(notificationEmail ?? "");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [revealed, setRevealed] = useState(false);

    async function sendCode() {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/notification-email/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });
            if (!res.ok) {
                const d = await res.json();
                setError(d.error ?? "Something went wrong");
                return;
            }
            setCode("");
            setStep("code");
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }

    async function confirm() {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/notification-email/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: code.trim() }),
            });
            const d = await res.json();
            if (!res.ok) {
                setError(d.error ?? "Something went wrong");
                return;
            }
            setConfirmedEmail(d.email);
            setStep("done");
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="bg-secondary rounded-sm p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">Email notifications</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Get an email when you make a sale or need to send a trade offer.
                    </p>
                </div>
                {step === "done" && (
                    <span className="text-xs px-2 py-0.5 rounded-sm bg-special/10 text-special shrink-0">Confirmed</span>
                )}
            </div>

            {step === "done" ? (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-primary/60 rounded-sm px-3 py-2.5">
                    <p className="text-sm break-all">{revealed ? confirmedEmail : maskEmail(confirmedEmail)}</p>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => setRevealed(r => !r)}
                            className="h-8 px-3 rounded-sm bg-accent button text-sm"
                        >
                            {revealed ? "Hide" : "Show"}
                        </button>
                        <button
                            onClick={() => { setStep("idle"); setEmail(confirmedEmail); setCode(""); setError(""); }}
                            className="h-8 px-3 rounded-sm bg-accent button text-sm"
                        >
                            Change
                        </button>
                    </div>
                </div>
            ) : step === "code" ? (
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-400">
                        Enter the 4-digit code sent to <span className="text-white break-all">{email}</span>.
                    </p>
                    <div className="flex gap-2">
                        <input
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            inputMode="numeric"
                            placeholder="1234"
                            className="bg-primary rounded-sm h-10 px-3 outline-none border border-gray-600 text-sm flex-1 min-w-0 tracking-widest"
                        />
                        <button
                            onClick={confirm}
                            disabled={loading || code.trim().length === 0}
                            className="h-10 px-4 rounded-sm bg-special button text-sm shrink-0"
                        >
                            {loading ? "..." : "Confirm"}
                        </button>
                    </div>
                    <button onClick={sendCode} disabled={loading} className="text-special text-xs underline underline-offset-2 self-start">
                        Resend code
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="bg-primary rounded-sm h-10 px-3 outline-none border border-gray-600 text-sm flex-1 min-w-0"
                    />
                    <button
                        onClick={sendCode}
                        disabled={loading || email.trim().length === 0}
                        className="h-10 px-4 rounded-sm bg-special button text-sm shrink-0"
                    >
                        {loading ? "..." : "Send code"}
                    </button>
                </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}
        </section>
    );
}

//

export default function OrdersClient({ purchases, currentUserId, notificationEmail, pendingEmail }: { purchases: Purchase[]; currentUserId: string; notificationEmail: string | null; pendingEmail: string | null }) {
    const groups = groupPurchases(purchases);

    const withRole = groups.map(g => ({
        group: g,
        role: (g.buyerId === currentUserId ? "buyer" : "seller") as "buyer" | "seller",
    }));


    const active = withRole.filter(({ group }) => group.status === "pending");
    const clearing = withRole.filter(({ group }) => group.status === "holding");
    const history = withRole.filter(({ group }) => group.status !== "pending" && group.status !== "holding");

    return (
        <div className="w-full flex-1 min-h-0 flex justify-center pt-40 px-4 md:px-8 overflow-y-auto pb-10">
            <div className="w-full max-w-3xl flex flex-col gap-8 h-fit">
                <h1 className="text-2xl font-bold">
                    Orders
                </h1>


                <EmailNotificationCard notificationEmail={notificationEmail} pendingEmail={pendingEmail} />


                {/* Active trades, front and center */}
                <section className="flex flex-col gap-3">
                    <h2 className="text-lg font-semibold">
                        Active {active.length === 1 ? "trade" : "trades"}

                        {active.length > 0 && (
                            <span className="text-gray-500 font-normal text-sm ml-2">
                                {active.length}
                            </span>
                        )}
                    </h2>

                    {active.length === 0 ? (
                        <div className="bg-secondary rounded-sm p-6 flex flex-col items-start gap-2">
                            <p className="text-sm text-gray-400">
                                No trades in progress.
                            </p>

                            <Link href="/market" className="text-special text-sm underline underline-offset-2">
                                Browse the market
                            </Link>
                        </div>
                    ) : (
                        active.map(({ group, role }) => (
                            <ActiveTradeCard key={group.ids[0]} group={group} role={role} />
                        ))
                    )}
                </section>


                {/* Clearing — delivered, inside the 7-day reversal hold */}
                {clearing.length > 0 && (
                    <section className="flex flex-col gap-3">
                        <h2 className="text-lg font-semibold">
                            Clearing
                            <span className="text-gray-500 font-normal text-sm ml-2">
                                {clearing.length}
                            </span>
                        </h2>

                        {clearing.map(({ group, role }) => (
                            <ActiveTradeCard key={group.ids[0]} group={group} role={role} />
                        ))}
                    </section>
                )}


                {/* History */}
                {history.length > 0 && (
                    <section className="flex flex-col gap-3">
                        <h2 className="text-lg font-semibold">
                            History
                        </h2>

                        <div className="flex flex-col gap-2">
                            {history.map(({ group, role }) => (
                                <HistoryRow key={group.ids[0]} group={group} role={role} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

