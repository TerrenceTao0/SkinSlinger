import "./globals.css";
import { Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import Providers from "./components/Providers"
import TopNav from "./components/TopNav"
import type { Metadata } from 'next'

//

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
})

//

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
    title: {
        default: 'SkinSlinger',
        template: '%s | SkinSlinger',
    },
    description: 'The P2P Steam skin marketplace with 0% sales fees, no KYC, no middleman, and no trade hold. Buy and sell CS2, Dota 2, Rust, and TF2 skins directly with other players.',
    keywords: ['steam marketplace', 'CS2 skins', 'Dota 2 items', 'Rust skins', 'TF2 items', 'buy skins', 'sell skins', 'P2P skin trading', 'no KYC', 'no fees', 'crypto payments'],
    openGraph: {
        siteName: 'SkinSlinger',
        type: 'website',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
    },
    icons: {
        icon: '/logo.svg',
    },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={`${inter.variable} font-sans`}>
            <body className="h-screen w-[95%] mx-auto flex flex-col overflow-hidden">
                <Providers>
                    <TopNav />
                    {children}
                </Providers>

                <Analytics />
            </body>
        </html>
    );
}
