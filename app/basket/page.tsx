"use client"

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useBasket } from "@/app/components/BasketProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

//

export default function Basket() {
    const { data: session } = useSession();
    const { basket, setBasket, clearBasketState } = useBasket();
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (session === null) router.push("/");
    }, [session, router])


    function remove(id: string) {
        setBasket(basket.filter(item => item.id !== id));
    }


    async function checkout() {
        setChecking(true);
        setError("");

        const res = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                items: basket.map(i => ({
                    id: i.id,
                    marketName: i.marketName,
                    commodity: i.commodity,
                    quantity: i.quantity,
                })),
            }),
        });


        const data = await res.json();

        if (res.ok) {
            clearBasketState();

        } else {
            setError(data.error ?? "Checkout failed");
        }


        setChecking(false);
    }
    

    const total = basket.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cash = session?.user?.cash ?? 0;
    const canAfford = cash >= total && basket.length > 0;

    return (
        <div className="w-full h-full flex justify-center items-center">
            <div className="bg-secondary flex mt-14 w-310 h-210">

                {/* Item list */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                    {basket.length === 0 ? (
                        <p className="opacity-50 text-center mt-10">Your basket is empty</p>
                    ) : (
                        basket.map(item => (
                            <div key={item.id} className="bg-accent flex items-center gap-4 p-3 rounded-sm">
                                <div style={{ filter: `drop-shadow(0 0 6px #${item.hexColor}99)` }}>
                                    <Image src={item.icon} alt="" width={60} height={60} style={{ width: 'auto' }} />
                                </div>

                                <div className="flex-1">
                                    <p style={{ color: `#${item.hexColor}` }}>{item.marketName}</p>
                                    <p className="text-sm opacity-60">${item.price.toFixed(2)} each</p>
                                </div>

                                {item.quantity > 1 && (
                                    <span className="opacity-60 text-sm">x{item.quantity}</span>
                                )}

                                <p className="w-16 text-right">${(item.price * item.quantity).toFixed(2)}</p>

                                <button onClick={() => remove(item.id)} className="bg-remove button w-16 h-8 text-sm rounded-sm">
                                    REMOVE
                                </button>
                            </div>
                        ))
                    )}
                </div>


                {/* Summary panel */}
                <div className="w-60 bg-primary flex flex-col p-6 gap-4 shrink-0">
                    <p className="text-2xl">Summary</p>
                    <div className="border-t border-white/10" />

                    <div className="flex justify-between">
                        <p className="opacity-60">Items</p>
                        <p>{basket.reduce((sum, i) => sum + i.quantity, 0)}</p>
                    </div>

                    <div className="flex justify-between">
                        <p className="opacity-60">Total</p>
                        <p>${total.toFixed(2)}</p>
                    </div>

                    <div className="border-t border-white/10" />

                    <div className="flex justify-between">
                        <p className="opacity-60">Your Balance</p>
                        <p className="text-special">${cash.toFixed(2)}</p>
                    </div>

                    <div className="flex justify-between">
                        <p className="opacity-60">After Purchase</p>
                        <p className={cash - total < 0 ? "text-red-500" : ""}>${(cash - total).toFixed(2)}</p>
                    </div>

                    {!canAfford && basket.length > 0 && (
                        <p className="text-red-500 text-sm">Insufficient balance</p>
                    )}

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        onClick={checkout}
                        disabled={!canAfford || checking}
                        className={`mt-auto w-full h-10 rounded-sm ${canAfford && !checking ? "bg-special button" : "bg-accent opacity-50"}`}
                    >
                        {checking ? "PROCESSING..." : "CHECKOUT"}
                    </button>
                </div>
            </div>
        </div>
    );
}
