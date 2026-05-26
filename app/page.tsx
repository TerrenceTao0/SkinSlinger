import Link from "next/link"
import Image from "next/image"

//

const games = [
    { label: "CS2", icon: "/cs2.png" },
    { label: "Dota 2", icon: "/dota.png" },
    { label: "Rust", icon: "/rust.png" },
    { label: "TF2", icon: "/tf2.png" },
]

const fees = [
    { label: "Sales Fee", value: "0%", icon: "/percentage.svg" },
    { label: "Deposit Fee", value: "0%", icon: "/deposit.svg" },
    { label: "FX Fee (Crypto)", value: "0%", icon: "/percentage.svg" },
    { label: "Withdrawal Fee", value: "Just 2%", icon: "/withdraw.svg" },
]

const steps = [
    {
        title: "Order an item",
        desc: "You place an order and your payment is held securely by the server. The seller doesn't receive it yet.",
    },
    {
        title: "Seller sends the trade",
        desc: "The seller is notified and sends you a Steam trade offer directly from their account.",
    },
    {
        title: "You accept the trade",
        desc: "Once you accept the trade offer, the item arrives in your inventory instantly with no trade hold.",
    },
    {
        title: "Server verifies the trade",
        desc: "Every 5 minutes, the server checks your Steam inventory to confirm the item was received. If your inventory is private, it will assume the trade was successful",
    },
    {
        title: "Seller gets paid",
        desc: "Once confirmed, the held funds are released to the seller's balance.",
    },
]

const paymentMethods = ["USDC (Polygon Network)"]

//

export default function Home() {
    return (
        <div className="overflow-y-auto h-full w-full no-scrollbar">
            <div className="flex flex-col justify-center items-center gap-6 px-4 pt-35 pb-16">
                <div className="flex flex-col items-center text-center gap-3">
                    <Image src="/logo.svg" alt="" width={60} height={60} />
                    <h1 className="text-4xl font-bold">SkinSlinger</h1>
                    <p className="text-gray-400 text-lg max-w-md">
                        The *new* P2P skin marketplace. No bots, no middleman, no hidden fees, no id, no BS.
                        <br />
                        Trade directly with other players straight away.
                    </p>
                </div>


                <div className="flex gap-3 text-sm flex-wrap justify-center">
                    {games.map(({ label, icon }) => (
                        <span key={label} className="bg-accent px-3 py-1.5 rounded-sm flex items-center gap-1.5 opacity-80">
                            <Image src={icon} alt={label} width={16} height={16} />
                            {label}
                        </span>
                    ))}
                </div>


                <div className="bg-secondary rounded-sm px-5 py-3 max-w-lg text-center text-sm text-gray-400">
                    Minimum item price - $0.30
                </div>


                <div
                    className="w-full max-w-sm rounded-sm px-6 py-5 flex flex-col items-center gap-1 bg-green-200"
                    style={{ boxShadow: "0 0 32px rgba(76, 107, 34, 0.6), 0 0 8px rgba(76, 107, 34, 0.3)" }}
                >
                    <p className="text-special text-2xl font-bold underline">No KYC</p>
                    <p className="text-special text-sm text-center font-semibold">No identity verification required. Sign up with just an email and a password.</p>
                </div>


                <div className="flex flex-col items-center text-center gap-1">
                    <p className="text-green-200 font-semibold text-lg">The lowest fees in the market. By far.</p>
                </div>

                
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


                <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-gray-500 tracking-widest">CURRENTLY SUPPORTED PAYMENT METHODS</p>
                    <div className="flex gap-2 flex-wrap justify-center">
                        {paymentMethods.map(method => (
                            <span key={method} className="bg-accent text-gray-400 text-xs px-3 py-1 rounded-sm">
                                {method}
                            </span>
                        ))}
                    </div>
                </div>


                <div className="flex gap-3">
                    <Link href="/market">
                        <button className="button bg-special px-8 h-11 rounded-sm font-medium">
                            Browse Market
                        </button>
                    </Link>

                    <Link href="/sign-up">
                        <button className="button bg-special px-8 h-11 rounded-sm font-medium">
                            Sign Up
                        </button>
                    </Link>
                </div>


                <div className="flex flex-col items-center gap-1 opacity-40 animate-bounce mt-7">
                    <Image src="/arrow-down.svg" alt="Scroll Down" height={40} width={40} className="invert" />
                </div>
            </div>


            <div className="w-full max-w-lg mx-auto px-4 pb-16">
                <h2 className="text-2xl font-bold text-center mb-8">How it works</h2>

                <div className="flex flex-col gap-3">
                    {steps.map((step, i) => (
                        <div key={i} className="info-card">
                            <p className="font-semibold text-sm">{step.title}</p>
                            <p className="text-gray-400 text-sm mt-1">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
