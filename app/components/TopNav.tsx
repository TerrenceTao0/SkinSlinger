"use client";

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useBasket } from './BasketProvider';

//

export default function TopNav() {
    const { data: session } = useSession();
    const { basket } = useBasket();
    let basketCount = 0

    for (let i = 0; i < basket.length; i++) {
        const item = basket[i];

        if ("quantity" in item) {
            basketCount += item.quantity;
        } 
        else {
            basketCount += 1;
        }
    }


    return (
        <nav className="fixed top-2 h-14 w-[95%] left-[2.5%] z-50 flex">
            <div className="w-43 h-full flex justify-center items-center bg-secondary">
                <Link href="/">
                    <p className="hover:text-special transition-all cursor-pointer text-2xl font-bold">
                        SkinSlinger
                    </p>
                </Link>
            </div>

            <div className="flex-1 h-full flex justify-between items-center bg-secondary ml-3">
                <div className="flex justify-center items-center h-full">
                    
                </div>

                <div className="flex h-full">
                    {session && (
                        <Link href="/finance">
                            <button 
                            className="h-full cursor-pointer flex items-center justify-center w-20 bg-special button"
                            >
                                ${session.user.cash?.toFixed(2)}
                            </button>
                        </Link>
                    )}

                    {session ? (
                        <>
                            <Link href="/basket" className="right-nav-link button">
                                Basket{basketCount > 0 && ` (${basketCount})`}
                            </Link>

                            <Link href="/orders" className="right-nav-link button">
                                Orders
                            </Link>

                            <Link href="/inventory" className="right-nav-link button">
                                Inventory
                            </Link>

                            <button
                                className="right-nav-link button"
                                onClick={() => signOut({ callbackUrl: '/' })}
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="right-nav-link button">
                                Login
                            </Link>

                            <Link href="/sign-up" className="right-nav-link button">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}

