import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

    return [
        { url: `${base}/`, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
        { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
        { url: `${base}/sign-up`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    ]
}
