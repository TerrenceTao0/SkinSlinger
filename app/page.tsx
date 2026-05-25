import Link from "next/link"
import Image from "next/image"

//

const games = [
    { label: "CS2", icon: "/cs2.png" },
    { label: "Dota 2", icon: "/dota.png" },
    { label: "Rust", icon: "/rust.png" },
]

const fees = [
    { label: "Sales Fee", value: "0%", icon: "/percentage.svg" },
    { label: "Deposit Fee", value: "0%", icon: "/deposit.svg" },
    { label: "Withdrawal Fee", value: "2.9% + $0.50", icon: "/withdraw.svg" },
]

//

export default function Home() {
    return (
        <div className="flex h-full w-full flex-col justify-center items-center gap-6 px-4">

            {/* Hero */}
            <div className="flex flex-col items-center text-center gap-3">
                <Image src="/exchange.svg" alt="" width={40} height={40} className="invert" />
                <h1 className="text-4xl font-bold">SkinSlinger</h1>
                <p className="text-gray-400 text-lg max-w-md">
                    The New P2P Steam skin marketplace. No bots, no middleman — buy and sell directly with other players.
                </p>
            </div>

            {/* Games */}
            <div className="flex gap-3 text-sm">
                {games.map(({ label, icon }) => (
                    <span key={label} className="bg-accent px-3 py-1.5 rounded-sm flex items-center gap-1.5 opacity-80">
                        <Image src={icon} alt={label} width={16} height={16} />
                        {label}
                    </span>
                ))}
            </div>

            {/* No trade hold callout */}
            <div className="bg-secondary rounded-sm px-5 py-3 max-w-lg text-center text-sm text-gray-400 border-l-2 border-special">
                Items are sent directly between users - no bot, no 7-day trade hold. Only items without an active trade hold can be listed.
                <br />
                Minimum price - $0.10
            </div>

            {/* Lowest fees callout */}
            <div className="flex flex-col items-center text-center gap-1">
                <p className="text-special font-semibold text-lg">The lowest fees in the market. Guaranteed.</p>
            </div>

            {/* Fee cards */}
            <div className="bg-secondary rounded-sm w-full max-w-sm">
                {fees.map(({ label, value, icon }, i) => (
                    <div key={label} className={`flex items-center justify-between px-5 py-3 ${i < fees.length - 1 ? 'border-b border-gray-700' : ''}`}>
                        <div className="flex items-center gap-3">
                            <Image src={icon} alt="" width={18} height={18} className="opacity-60 invert" />
                            <span className="text-sm text-gray-400">{label}</span>
                        </div>
                        <span className="font-semibold text-special">{value}</span>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <div className="flex gap-3 mt-2">
                <Link href="/market">
                    <button className="button bg-special px-8 h-11 rounded-sm font-medium">
                        Browse Market
                    </button>
                </Link>
                <Link href="/sign-up">
                    <button className="button bg-accent px-8 h-11 rounded-sm font-medium">
                        Sign Up
                    </button>
                </Link>
            </div>

        </div>
    )
}
