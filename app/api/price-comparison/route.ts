import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const BASE_URL = 'https://www.steamwebapi.com';

export async function GET(req: NextRequest) {
    // Each upstream call costs steamwebapi credits — don't proxy for anonymous callers.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const market_hash_name = req.nextUrl.searchParams.get('market_hash_name');
    if (!market_hash_name?.trim()) {
        return Response.json({ error: 'market_hash_name required' }, { status: 400 });
    }

    const url = new URL(`${BASE_URL}/markets/prices`);
    url.searchParams.set('key', process.env.STEAM_WEB_KEY!);
    url.searchParams.set('market_hash_name', market_hash_name.trim());

    try {
        const res = await fetch(url.toString());
        if (!res.ok) return Response.json({ error: 'Failed to fetch prices' }, { status: 502 });

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
            return Response.json({ results: [] });
        }

        const rawPrices = data[0].prices as Record<string, { price: number }>;
        const results = Object.entries(rawPrices)
            .filter(([, v]) => typeof v?.price === 'number' && v.price > 0)
            .map(([slug, v]) => ({
                slug,
                name: slug,
                price: v.price,
            }));

        const ourListing = await prisma.item_listing.findFirst({
            where: { marketName: { equals: market_hash_name.trim(), mode: 'insensitive' } },
            orderBy: { price: 'asc' },
            select: { price: true },
        });

        if (ourListing) {
            results.push({ slug: 'skinslinger', name: 'SkinSlinger', price: ourListing.price });
        }

        results.sort((a, b) => a.price - b.price);

        return Response.json({ results });
    } catch {
        return Response.json({ error: 'Internal error' }, { status: 500 });
    }
}
