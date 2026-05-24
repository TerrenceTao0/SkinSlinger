import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import OrdersClient from "./OrdersClient";

//

export default async function OrdersPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) redirect("/login");

    const purchases = await prisma.purchase.findMany({
        where: {
            OR: [
                { buyerId: session.user.id },
                { sellerId: session.user.id },
            ],
        },
        include: {
            buyer: { select: { username: true, email: true, steam_trade_url: true } },
            seller: { select: { username: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return <OrdersClient purchases={purchases} currentUserId={session.user.id} />;
}
