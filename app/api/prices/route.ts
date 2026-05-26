import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchItemPrice } from '@/lib/steam';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await request.json();

    const encoder = new TextEncoder();

    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);

    // Load all cached prices for the requested items
    const marketNames = items.map((i: { market_name: string }) => i.market_name);
    const cached = await prisma.item.findMany({
        where: { marketName: { in: marketNames } },
        select: { marketName: true, price: true, updatedAt: true },
    });
    const cacheMap = new Map(cached.map(c => [c.marketName, c]));

    const stream = new ReadableStream({
        async start(controller) {
            await Promise.all(items.map(async (item: { market_name: string, market_hash_name: string, game: string }) => {
                const hit = cacheMap.get(item.market_name);

                // Return cached price if it was updated today
                if (hit && hit.updatedAt >= todayUtc) {
                    controller.enqueue(encoder.encode(
                        JSON.stringify({ market_name: item.market_name, price: hit.price }) + '\n'
                    ));
                    return;
                }

                const result = await fetchItemPrice(item.market_hash_name, item.game);
                const price = result?.price ?? 0;

                if (result && price >= 0.30) {
                    await prisma.item.upsert({
                        where: { marketName: item.market_name },
                        update: { price },
                        create: { marketName: item.market_name, marketHashName: item.market_hash_name, price, game: item.game }
                    });
                }

                controller.enqueue(encoder.encode(
                    JSON.stringify({ market_name: item.market_name, price }) + '\n'
                ));
            }));

            controller.close();
        }
    });

    return new Response(stream, {
        headers: { 'Content-Type': 'application/x-ndjson' }
    });
}
