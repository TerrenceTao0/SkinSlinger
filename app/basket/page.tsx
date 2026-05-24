import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import BasketClient from "./BasketClient";

//

export default async function BasketPage() {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

    const hasPendingPurchase = userId ? (await prisma.purchase.count({
        where: { buyerId: userId, status: { in: ["pending", "offer_sent"] } },
    })) > 0 : false;

    return <BasketClient hasPendingPurchase={hasPendingPurchase} />;
}
