import Link from "next/link"

//

export default function Guide() {
    return (
        <div className="flex h-full w-full justify-center items-center">
            <div className="flex flex-col justify-center items-center bg-secondary w-100 rounded-sm text-center frame-shadow px-4 py-8 gap-3">
                <p className="font-semibold text-less-special">About Us</p>
                <h1>SkinSlinger is a brand new P2P (no bot) marketplace for buying/selling items from CS2, Dota2, and Rust.</h1>
                <hr className="border-white w-full" />

                <p className="font-semibold text-less-special">All Fees</p>
                <div className="text-[15px] w-full">
                    <div className="flex justify-between w-full">
                        <p>Sales Fee:</p>
                        <p className="text-green-400">0%</p>
                    </div>

                    <div className="flex justify-between w-full">
                        <p>Deposit Fee:</p>
                        <p className="text-green-400">0%</p>
                    </div>

                    <div className="flex justify-between w-full">
                        <p>Withdrawal Fee (Stripe):</p>
                        <p className="text-green-400">2.9% + $0.50 Flat</p>
                    </div>
                </div>

                <hr className="border-white w-full" />

                <p className="font-semibold text-less-special">Payment Methods</p>
                <div className="text-[15px] w-full">
                    <p>Card</p>
                </div>

                <hr className="border-white w-full" />

                <Link href="/">
                    <button className="button w-70 h-10 bg-accent rounded-sm mt-4">
                        Okay
                    </button>
                </Link>
            </div>
        </div>
    )
}

