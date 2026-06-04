import "./globals.css";
import { Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import Providers from "./components/Providers"
import TopNav from "./components/TopNav"
import type { Metadata, Viewport } from 'next'

//

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
})

//

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: '#171A21',
}

const OG_IMAGE = { url: '/logo.png', width: 512, height: 512, alt: 'SkinSlinger' }

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
    title: {
        default: 'SkinSlinger — Buy & Sell Steam Skins with Crypto',
        template: '%s | SkinSlinger',
    },
    description: 'SkinSlinger is the P2P Steam skin marketplace with 0% sales fee, no KYC, and no trade hold. Buy and sell CS2, Dota 2, Rust, and TF2 skins with crypto — no middleman, no identity checks.',
    keywords: [
        'CS2 skins', 'buy CS2 skins', 'sell CS2 skins', 'CS2 skin marketplace',
        'Dota 2 items', 'Rust skins', 'TF2 items', 'Steam marketplace',
        'buy skins with crypto', 'no KYC skin marketplace', '0% fee skin marketplace',
        'P2P skin trading', 'crypto skin marketplace', 'no trade hold',
    ],
    openGraph: {
        siteName: 'SkinSlinger',
        type: 'website',
        locale: 'en_US',
        images: [OG_IMAGE],
    },
    twitter: {
        card: 'summary',
        images: ['/logo.png'],
    },
    icons: {
        icon: '/logo.png',
    },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={`${inter.variable} font-sans`}>
            <body className="h-screen mx-auto flex flex-col  overflow-hidden">
                <Providers>
                    <TopNav />
                    {children}
                </Providers>

                <Analytics />
            </body>
        </html>
    );
}
