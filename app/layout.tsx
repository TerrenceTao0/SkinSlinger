import "./globals.css";
import TopNav from "./components/TopNav"
import Providers from "./components/Providers"
import { Fredoka } from 'next/font/google'

const fredoka = Fredoka({
    subsets: ['latin'],
    variable: '--font-fredoka',
})

//

export default function RootLayout({
children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fredoka.variable} font-sans`}>
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

