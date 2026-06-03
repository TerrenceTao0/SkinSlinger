import type { MetadataRoute } from 'next';

const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/inventory', '/orders', '/basket', '/finance', '/reset-password', '/status', '/api/'],
            },
            { userAgent: 'GPTBot',         disallow: '/' },
            { userAgent: 'ClaudeBot',      disallow: '/' },
            { userAgent: 'Google-Extended', disallow: '/' },
        ],
        sitemap: `${base}/sitemap.xml`,
    };
}
