"use client";

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

//

export default function TopNav() {
    const { data: session } = useSession();

    return (
        <nav className="fixed top-2 h-14 w-[95%] left-[2.5%] z-50 flex">
            <div className="w-43 h-full flex justify-center items-center bg-secondary">
                <Link href="/">
                    <p className="hover:text-special transition-all cursor-pointer text-4xl font-semi-bold">
                        Bifrost
                    </p>
                </Link>
            </div>

            <div className="flex-1 h-full flex justify-between items-center bg-secondary ml-3">
                <div className="flex justify-center items-center h-full">
                    
                </div>

                <div className="flex h-full">
                    {session && (
                        <p className="h-full cursor-pointer flex items-center justify-center w-20 bg-special button">
                            ${session.user.cash?.toFixed(2)}
                        </p>
                    )}

                    <Link href="/basket" className="right-nav-link button">
                        BASKET
                    </Link>

                    {session ? (
                        <>
                            <Link href="/inventory" className="right-nav-link button">
                                INVENTORY
                            </Link>

                            <Link
                                href="/sign-up"
                                className="right-nav-link button"
                                onClick={() => signOut()}
                            >
                                LOG OUT
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="right-nav-link button">
                                LOGIN
                            </Link>

                            <Link href="/sign-up" className="right-nav-link button">
                                SIGN UP
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}

