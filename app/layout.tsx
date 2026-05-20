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

      <body className="h-screen flex flex-col m-0 overflow-hidden antialiased">
            <Providers>
                <TopNav />
                {children}
            </Providers>
        </body>
    </html>
  );
}

