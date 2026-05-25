"use client";

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useBasket } from './BasketProvider';

//

export default function TopNav() {
    const { data: session } = useSession();
    const { basket } = useBasket();
    const [menuOpen, setMenuOpen] = useState(false);

    let basketCount = 0

    for (let i = 0; i < basket.length; i++) {
        const item = basket[i];

        if ("quantity" in item) basketCount += item.quantity;

        else basketCount += 1;
    }


    return (
        <>
            <nav className="fixed top-2 h-14 w-[95%] left-[2.5%] z-50 flex">
                <div className="w-43 h-full flex justify-center items-center bg-secondary rounded-sm shrink-0">
                    <Link href="/">
                        <p className="hover:text-special transition-all cursor-pointer text-2xl font-bold">
                            SkinSlinger
                        </p>
                    </Link>
                </div>


                {/* Desktop nav */}
                <div className="flex-1 h-full hidden md:flex justify-between items-center bg-secondary ml-3 rounded-sm pl-3 pr-3">
                    <div className="flex h-full items-center gap-3">
                        <Link href="/market" className="right-nav-link button">Market</Link>               
                    </div>

                    <div className="flex h-full items-center gap-3">
                        {session ? (
                            <>
                                <Link href="/finance" className="h-full flex items-center">
                                    <button className="h-[80%] flex items-center justify-center w-20 bg-special button rounded-sm">
                                        ${session.user.cash?.toFixed(2)}
                                    </button>
                                </Link>

                                <Link href="/basket" className="right-nav-link button">
                                    Basket{basketCount > 0 && `(${basketCount})`}
                                </Link>
                                
                                <Link href="/orders" className="right-nav-link button">Orders</Link>
                                <Link href="/inventory" className="right-nav-link button">Inventory</Link>

                                <button className="right-nav-link button" onClick={() => signOut({ callbackUrl: '/' })}>
                                    Log out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="right-nav-link button">Login</Link>
                                <Link href="/sign-up" className="right-nav-link button">Sign Up</Link>
                            </>
                        )}
                    </div>
                </div>


                {/* Mobile nav */}
                <div className="flex-1 h-full md:hidden flex justify-end items-center bg-secondary ml-3 rounded-sm px-3 gap-3 w-[20%]">
                    {session && (
                        <Link href="/finance">
                            <button className="h-8 px-3 cursor-pointer flex items-center justify-center bg-special button rounded-sm text-sm">
                                ${session.user.cash?.toFixed(2)}
                            </button>
                        </Link>
                    )}

                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex flex-col gap-1.25 p-2 cursor-pointer"
                        aria-label="Menu"
                    >
                        <span className="block w-5 h-0.5 bg-white" />
                        <span className="block w-5 h-0.5 bg-white" />
                        <span className="block w-5 h-0.5 bg-white" />
                    </button>
                </div>
            </nav>


            {/* Mobile dropdown */}
            {menuOpen && (
                <div className="md:hidden fixed top-16 right-[2.5%] w-[50%] z-49 bg-secondary rounded-sm">
                    {session ? (
                        <>
                            <Link href="/market" className="flex items-center px-4 h-12 border-b border-gray-700 button" onClick={() => setMenuOpen(false)}>
                                Market
                            </Link>

                            <Link href="/basket" className="flex items-center px-4 h-12 border-b border-gray-700 button" onClick={() => setMenuOpen(false)}>
                                Basket{basketCount > 0 && ` (${basketCount})`}
                            </Link>

                            <Link href="/orders" className="flex items-center px-4 h-12 border-b border-gray-700 button" onClick={() => setMenuOpen(false)}>
                                Orders
                            </Link>

                            <Link href="/inventory" className="flex items-center px-4 h-12 border-b border-gray-700 button" onClick={() => setMenuOpen(false)}>
                                Inventory
                            </Link>

                            <button
                                className="flex items-center px-4 h-12 w-full text-left button"
                                onClick={() => { signOut({ callbackUrl: '/' }); setMenuOpen(false); }}
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/market" className="flex items-center px-4 h-12 border-b border-gray-700 button" onClick={() => setMenuOpen(false)}>
                                Market
                            </Link>

                            <Link href="/login" className="flex items-center px-4 h-12 border-b border-gray-700 button" onClick={() => setMenuOpen(false)}>
                                Login
                            </Link>

                            <Link href="/sign-up" className="flex items-center px-4 h-12 button" onClick={() => setMenuOpen(false)}>
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            )}
        </>
    )
}

