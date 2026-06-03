import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

function toSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // One item type page per unique market name (these are the indexed pages)
    const groups = await prisma.item_listing.groupBy({
        by: ['marketName'],
        _min: { createdAt: true },
    });

    const itemUrls: MetadataRoute.Sitemap = groups.map(g => ({
        url: `${base}/item/${toSlug(g.marketName)}`,
        lastModified: g._min.createdAt ?? new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
    }));

    return [
        { url: `${base}/`,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
        { url: `${base}/market/cs2`,   lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
        { url: `${base}/market/dota2`, lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
        { url: `${base}/market/rust`,  lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
        { url: `${base}/market/tf2`,   lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
        ...itemUrls,
    ];
}
