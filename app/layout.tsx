import "./globals.css";
import { Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import Providers from "./components/Providers"
import TopNav from "./components/TopNav"

//

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
})

//

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={`${inter.variable} font-sans`}>
            <title>SkinSlinger</title>
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
