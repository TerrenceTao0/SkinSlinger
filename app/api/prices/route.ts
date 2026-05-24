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

    const stream = new ReadableStream({
        async start(controller) {
            await Promise.all(items.map(async (item: { market_name: string, market_hash_name: string, game: string }) => {
                const result = await fetchItemPrice(item.market_hash_name, item.game);
                const price = result?.price ?? 0;

                if (result && price >= 0.10) {
                    await prisma.item.upsert({
                        where: { marketName: item.market_name },
                        update: { price },
                        create: { marketName: item.market_name, price, docId: result.docId }
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
