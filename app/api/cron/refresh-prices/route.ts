import { prisma } from "@/lib/db";
import { fetchItemPrice } from "@/lib/steam";

//

export async function GET(req: Request) {
    const secret = process.env.CRON_SECRET;

    if (secret) {
        const auth = req.headers.get("authorization");
        if (auth !== `Bearer ${secret}`) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    const items = await prisma.item.findMany({
        select: { marketName: true, marketHashName: true, game: true },
    });

    let updated = 0;
    let failed = 0;

    await Promise.all(items.map(async (item) => {
        const result = await fetchItemPrice(item.marketHashName, item.game);

        if (result && result.price >= 0.30) {
            await prisma.item.update({
                where: { marketName: item.marketName },
                data: { price: result.price },
            });
            updated++;
        } else {
            failed++;
        }
    }));

    return Response.json({ updated, failed });
}
