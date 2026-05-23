import "./globals.css";
import TopNav from "./components/TopNav"
import Providers from "./components/Providers"
import { Inter } from 'next/font/google'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
})

//

export default function RootLayout({
children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <title>Bifrost Markets</title>

      <body className="h-screen w-[95%] mx-auto flex flex-col overflow-hidden">
            <Providers>
                <TopNav />
                {children}
            </Providers>
        </body>
    </html>
  );
}

