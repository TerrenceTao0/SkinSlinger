"use client";

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useBasket } from './BasketProvider';
import { signIn } from 'next-auth/react';

//

export default function TopNav() {
    const { data: session, status } = useSession();
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
                <div className="w-43 h-full flex justify-center items-center bg-secondary rounded-sm shrink-0 frame-shadow">
                    <Link href="/">
                        <p className="hover:text-special transition-all cursor-pointer text-2xl font-bold">
                            SkinSlinger
                        </p>
                    </Link>
                </div>


                {/* Desktop nav */}
                <div className="flex-1 h-full hidden md:flex justify-between items-center bg-secondary ml-3 rounded-sm pl-3 pr-3 frame-shadow">
                    <div className="flex h-full items-center gap-3">
                        <Link href="/market" className="right-nav-link button">Market</Link>
                    </div>

                    <div className="flex h-full items-center gap-3">
                        {status !== "loading" && (session ? (
                            <>
                                <Link href="/finance" className="h-full flex items-center">
                                    <button className="h-[80%] flex items-center justify-center w-20 bg-special button rounded-sm">
                                        ${(session.user.cash ?? 0).toFixed(2)}
                                    </button>
                                </Link>

                                {basketCount > 0 && (
                                    <Link href="/basket" className="right-nav-link button bg-special">
                                        Basket ({basketCount})
                                    </Link>
                                )}

                                <Link href="/listings" className="right-nav-link button">Listings</Link>
                                <Link href="/orders" className="right-nav-link button">Orders</Link>
                                <Link href="/inventory" className="right-nav-link button">Inventory</Link>

                                <Link href="/profile" className="cursor-pointer">
                                    <Image src={session.user.image!} alt="Profile" width={40} height={40} />
                                </Link>
                            </>
                        ) : (
                            <button
                                onClick={() => signIn('steam', { callbackUrl: '/market' })}
                                className="flex items-center gap-2 h-[80%] px-4 rounded-sm cursor-pointer transition-all bg-[#1b2838] hover:bg-[#2a475e] text-white text-sm font-medium"
                            >
                                <Image src="/steam-icon.svg" alt="Steam" width={20} height={20} className="shrink-0" />
                                Sign in through Steam
                            </button>
                        ))}
                    </div>
                </div>


                {/* Mobile nav */}
                <div className="flex-1 h-full md:hidden flex justify-end items-center bg-secondary ml-3 rounded-sm px-3 gap-3 w-[20%]">
                    {status !== "loading" && session && (
                        <>
                            <Link href="/finance">
                                <button className="h-8 px-3 cursor-pointer flex items-center justify-center bg-special button rounded-sm text-sm">
                                    ${(session.user.cash ?? 0).toFixed(2)}
                                </button>
                            </Link>

                            <Link href="/profile" className="cursor-pointer">
                                <Image src={session.user.image!} alt="Profile" width={40} height={40} />
                            </Link>
                        </>
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
                <nav className="md:hidden fixed top-18 right-[2.5%] w-[30%] z-49 bg-secondary rounded-sm flex flex-col divide-y divide-gray-700 frame-shadow">
                    {status !== "loading" && (session ? (
                        <>
                            <Link href="/market" className="mobile_menu_button button" onClick={() => setMenuOpen(false)}>
                                Market
                            </Link>

                            {basketCount > 0 && (
                                <Link href="/basket" className="mobile_menu_button button" onClick={() => setMenuOpen(false)}>
                                    Basket ({basketCount})
                                </Link>
                            )}

                            <Link href="/listings" className="mobile_menu_button button" onClick={() => setMenuOpen(false)}>
                                Listings
                            </Link>

                            <Link href="/orders" className="mobile_menu_button button" onClick={() => setMenuOpen(false)}>
                                Orders
                            </Link>

                            <Link href="/inventory" className="mobile_menu_button button" onClick={() => setMenuOpen(false)}>
                                Inventory
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/market" className="flex items-center px-4 h-12 border-b border-gray-700 button" onClick={() => setMenuOpen(false)}>
                                Market
                            </Link>

                            <button
                                onClick={() => { signIn('steam', { callbackUrl: '/market' }); setMenuOpen(false); }}
                                className="flex items-center gap-2 px-4 h-12 cursor-pointer transition-all bg-[#1b2838] hover:bg-[#2a475e] text-white text-sm font-medium"
                            >
                                <Image src="/steam-icon.svg" alt="Steam" width={16} height={16} className="shrink-0" />
                                Sign in through Steam
                            </button>
                        </>
                    ))}
                </nav>
            )}
        </>
    )
}
