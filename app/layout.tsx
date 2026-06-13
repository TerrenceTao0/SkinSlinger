import "./globals.css";
import { Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import Providers from "./components/Providers"
import TopNav from "./components/TopNav"
import type { Metadata, Viewport } from 'next'
import { getBaseUrl } from "./lib/site"

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
    metadataBase: new URL(getBaseUrl()),
    title: {
        default: 'No KYC Skins Marketplace — SkinSlinger',
        template: '%s | SkinSlinger',
    },
    description: 'SkinSlinger is the no KYC skins marketplace for CS2, Dota 2, Rust, and TF2. Buy and sell Steam skins with crypto — 0% sales fee, no identity verification, no trade hold.',
    keywords: [
        'no kyc skins marketplace', 'no kyc skin marketplace', 'no kyc steam skins',
        'sell rust skins for real money', 'rust skin marketplace', 'buy rust skins with crypto',
        'sell dota 2 items for real money', 'dota 2 skin marketplace', 'buy dota 2 skins with crypto',
        'sell tf2 items for real money', 'tf2 marketplace', 'tf2 unusual marketplace',
        'CS2 skins', 'buy CS2 skins', 'sell CS2 skins', 'CS2 skin marketplace',
        'buy skins with crypto', '0% fee skin marketplace', 'lowest fee skin marketplace',
        'P2P skin trading', 'crypto skin marketplace', 'no trade hold',
        'no kyc crypto marketplace', 'anonymous skin marketplace',
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
            <body className="h-dvh mx-auto flex flex-col overflow-hidden">
                <Providers>
                    <TopNav />
                    {children}
                </Providers>

                <Analytics />
            </body>
        </html>
    );
}
