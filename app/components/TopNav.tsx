import Image from 'next/image'
import Link from 'next/link'

//

export default function TopNav() {
    return (
        <>
            <nav className="fixed top-2 h-14 w-40 left-2 flex justify-center items-center z-50 bg-secondary">
                <Link href="/">
                    <p className="hover:text-special transition-all cursor-pointer text-4xl">
                        Bifrost
                    </p>
                </Link>
            </nav>

            <nav className="fixed top-2 h-14 w-433 left-45 flex justify-between items-center z-50 bg-secondary">
               <div className="flex justify-center items-center h-full">
                    <Link href="/login" className="right-nav-link button">
                        TRADE
                    </Link>
                </div>

                <div className="flex h-full">
                    <Link href="/login" className="right-nav-link button">
                        LOGIN
                    </Link>
                    
                    <Link href="/sign-up" className="right-nav-link button">
                        SIGN UP
                    </Link>

                    <Link href="/login" className="right-nav-link button">
                        BASKET
                    </Link>
                </div>
            </nav>
        </>
    )
}

