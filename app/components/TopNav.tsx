"use client";

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
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
                        {(session ? (
                            <>
                                <Link href="/finance" className="h-full flex items-center">
                                    <button className="h-[80%] flex items-center justify-center w-20 bg-special button rounded-sm">
                                        ${session.user.cash?.toFixed(2)}
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

                                <button className="right-nav-link button" onClick={() => signOut({ callbackUrl: '/' })}>
                                    Log out
                                </button>
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

                            <button
                                className="mobile_menu_button button w-full"
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

                            <button
                                onClick={() => { signIn('steam', { callbackUrl: '/market' }); setMenuOpen(false); }}
                                className="flex items-center gap-2 px-4 h-12 cursor-pointer transition-all bg-[#1b2838] hover:bg-[#2a475e] text-white text-sm font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 233 233" className="w-4 h-4 shrink-0" fill="white">
                                    <path d="M116.5 0C52.1 0 0 52.1 0 116.5c0 55.7 38.9 102.3 91.1 114L116.5 233l25.4-2.5C194.1 218.8 233 172.2 233 116.5 233 52.1 180.9 0 116.5 0zm0 21c52.7 0 95.5 42.8 95.5 95.5S169.2 212 116.5 212 21 169.2 21 116.5 63.8 21 116.5 21z"/>
                                    <path d="M105.3 148.4l-13.8-5.7c2.2 4.5 6.2 8.2 11.4 9.9 10.6 3.5 22.1-2.3 25.6-12.9 1.7-5.1 1.3-10.5-.9-15.2l-13.9-5.7c2.6-1 5.5-1.3 8.4-.4 5.1 1.7 8.8 5.9 9.9 10.9l23.2 9.6c-.6 17.2-14.9 30.9-32.4 30.9-14.7 0-27.1-9.8-31.2-23.2l13.7-4.2zM69 94.9l17.7 7.3c5.4-4.4 12.5-6.5 19.9-5.4 14 2 23.7 15 21.7 29.1-.2 1.5-.6 3-.9 4.4l17.4 7.2c1.3-3.8 2.1-7.8 2.1-12.1 0-24.4-19.8-44.2-44.2-44.2-12.2 0-23.2 5-31.2 13.1l-2.5.6z"/>
                                </svg>
                                Sign in through Steam
                            </button>
                        </>
                    ))}
                </nav>
            )}
        </>
    )
}
