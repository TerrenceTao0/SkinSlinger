import Image from 'next/image'
import Link from 'next/link'

//

export default function TopNav() {
    return (
        <>
            <nav className="fixed top-3 h-14 w-471 left-4 flex justify-between items-center pl-4 z-50 bg-secondary">
               <div className="flex justify-center items-center">
                    <Link href="/">
                        <p className="hover:text-special transition-all cursor-pointer text-4xl">
                            Bifrost
                        </p>
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

