import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

//

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }


        const user = await prisma.user.findUnique({ where: { email: session.user.email } });

        if (!user) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }


        const { items } = await request.json() as {
            items: { id: string, marketName: string, commodity: boolean, quantity: number }[]
        };


        if (!Array.isArray(items) || items.length === 0) {
            return Response.json({ error: "No items provided" }, { status: 400 });
        }


        // Resolve which listings to purchase
        const toPurchase: { id: string, price: number, sellerId: string }[] = [];

        for (const item of items) {
            if (item.commodity) {
                const listings = await prisma.item_listing.findMany({
                    where: {
                        marketName: item.marketName,
                        userId: { not: user.id },
                    },
                    take: item.quantity,
                    orderBy: { price: "asc" },
                });


                if (listings.length < item.quantity) {
                    return Response.json({ error: `Not enough "${item.marketName}" available` }, { status: 409 });
                }


                for (const l of listings) {
                    toPurchase.push({ id: l.id, price: l.price, sellerId: l.userId });
                }


            } 
            else {
                const listing = await prisma.item_listing.findUnique({ where: { id: item.id } });

                if (!listing) {
                    return Response.json({ error: `Listing for "${item.marketName}" no longer exists` }, { status: 409 });
                }


                if (listing.userId === user.id) {
                    return Response.json({ error: "You cannot buy your own listing" }, { status: 400 });
                }


                toPurchase.push({ id: listing.id, price: listing.price, sellerId: listing.userId });
            }
        }


        const total = toPurchase.reduce((sum, l) => sum + l.price, 0);

        if (user.cash < total) {
            return Response.json({ error: "Insufficient balance" }, { status: 402 });
        }


        // Process purchase in a transaction
        await prisma.$transaction(async (tx) => {
            // Deduct from buyer
            await tx.user.update({
                where: { id: user.id },
                data: { cash: { decrement: total } },
            });


            // Credit each seller and delete their listing
            for (const l of toPurchase) {
                await tx.user.update({
                    where: { id: l.sellerId },
                    data: { cash: { increment: l.price } },
                });


                await tx.item_listing.delete({ where: { id: l.id } });

                await tx.purchase.create({
                    data: { userId: user.id, itemId: l.id },
                });
            }
        });


        const updated = await prisma.user.findUnique({ where: { id: user.id }, select: { cash: true } });

        return Response.json({ newCash: updated!.cash });
    }
    catch (error) {
        console.error(error);

        return Response.json({ error: "Server error" }, { status: 500 });
    }
}

