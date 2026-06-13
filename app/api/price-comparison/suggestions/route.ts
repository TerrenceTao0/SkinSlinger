import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 2) return Response.json([]);

    const items = await prisma.item.findMany({
        where: { marketName: { contains: q, mode: 'insensitive' } },
        select: { marketName: true },
        orderBy: { marketName: 'asc' },
        take: 8,
    });

    return Response.json(items.map(i => i.marketName));
}
