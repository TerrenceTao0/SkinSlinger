"use client"

import { useBasket } from "@/app/components/BasketProvider";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function BuyButton({
    id, marketName, price, icon, hexColor, commodity,
}: {
    id: string;
    marketName: string;
    price: number;
    icon: string;
    hexColor: string;
    commodity: boolean;
}) {
    const { basket, setBasket } = useBasket();
    const { data: session } = useSession();
    const router = useRouter();

    function handleBuy() {
        if (!session) {
            router.push("/sign-up");
            return;
        }

        const alreadyIn = basket.find(b => commodity ? (b.marketName === marketName && b.commodity) : b.id === id);
        if (alreadyIn) {
            router.push("/basket");
            return;
        }

        setBasket([...basket, { id, marketName, price, icon, hexColor, commodity, quantity: 1, maxQuantity: 1 }]);
        router.push("/basket");
    }

    return (
        <button
            onClick={handleBuy}
            className="w-full h-10 rounded-sm bg-less-special button font-medium"
            style={hexColor !== 'b0c3d9' ? { borderTop: `2px solid #${hexColor}` } : {}}
        >
            BUY NOW
        </button>
    );
}
