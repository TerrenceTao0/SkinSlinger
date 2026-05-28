import Link from "next/link"
import Image from "next/image"
import type { Metadata } from 'next'

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
const description = 'SkinSlinger is the P2P Steam skin marketplace with 0% sales fee, no KYC, and no trade hold. Buy and sell CS2, Dota 2, Rust, and TF2 skins with crypto — no middleman, no identity checks, instant trades.'

export const metadata: Metadata = {
    title: 'Buy & Sell Steam Skins with Crypto - 0% Fee, No KYC',
    description,
    alternates: { canonical: '/' },
    openGraph: {
        title: 'Buy & Sell Steam Skins with Crypto - 0% Fee, No KYC | SkinSlinger',
        description,
        url: '/',
        images: [{ url: '/logo.svg', width: 512, height: 512, alt: 'SkinSlinger' }],
    },
    twitter: {
        card: 'summary',
        title: 'Buy & Sell Steam Skins with Crypto - 0% Fee, No KYC | SkinSlinger',
        description,
        images: ['/logo.svg'],
    },
}

const base = process.env.NEXTAUTH_URL ?? '';

const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "SkinSlinger",
    "url": base,
    "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": `${base}/market/cs2?search={search_term_string}` },
        "query-input": "required name=search_term_string",
    },
};

const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SkinSlinger",
    "url": base,
    "logo": `${base}/logo.svg`,
    "description": "P2P Steam skin marketplace with 0% sales fee, no KYC, and crypto payments.",
};

const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "Does SkinSlinger charge a sales fee?",
            "acceptedAnswer": { "@type": "Answer", "text": "No. SkinSlinger charges a 0% sales fee. Sellers keep 100% of their listed price." },
        },
        {
            "@type": "Question",
            "name": "Is KYC required on SkinSlinger?",
            "acceptedAnswer": { "@type": "Answer", "text": "No. SkinSlinger requires no identity verification (KYC). Sign up with just an email and password." },
        },
        {
            "@type": "Question",
            "name": "How do I pay on SkinSlinger?",
            "acceptedAnswer": { "@type": "Answer", "text": "SkinSlinger accepts USDC on the Polygon network. Deposit crypto and use your balance to buy skins instantly." },
        },
        {
            "@type": "Question",
            "name": "Is there a trade hold on SkinSlinger?",
            "acceptedAnswer": { "@type": "Answer", "text": "No. Trades have no hold. Items are transferred instantly via Steam peer-to-peer trades." },
        },
        {
            "@type": "Question",
            "name": "What games does SkinSlinger support?",
            "acceptedAnswer": { "@type": "Answer", "text": "SkinSlinger supports CS2 (Counter-Strike 2), Dota 2, Rust, and Team Fortress 2." },
        },
        {
            "@type": "Question",
            "name": "Are my skins safe?",
            "acceptedAnswer": { "@type": "Answer", "text": "Yes. We only ask for your Steam trade URL to check your inventory and trade eligibility. We have no direct access to your inventory or skins. The marketplace is P2P so you trade your skins directly with other players rather than giving it to a bot." },
        },
        {
            "@type": "Question",
            "name": "How long does it take to deposit/withdraw?",
            "acceptedAnswer": { "@type": "Answer", "text": "It should typically take less than 5 minutes for both." },
        },
    ],
};

//

function PointDown() { 
    return (
        <div className="flex flex-col items-center gap-1 opacity-40 animate-bounce mt-3">
            <Image src="/arrow-down.svg" alt="Scroll Down" height={40} width={40} className="invert" />
        </div>
    )
}


export default function Home() {
    return (
        <div className="overflow-y-auto h-full w-full no-scrollbar">
            <div className="flex flex-col justify-center items-center gap-6 px-4 pt-20">
                <div className="flex flex-col items-center text-center gap-3">
                    <Image src="/logo.svg" alt="" width={60} height={60} />
                    
                    <h1 className="text-4xl font-bold">
                        SkinSlinger
                    </h1>
                    
                    <p className="text-gray-400 text-lg max-w-md">
                        No bots, no middleman, no hidden fees, no BS.
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


                <div
                    className="w-full max-w-sm rounded-sm px-6 py-5 flex flex-col items-center gap-1 bg-green-200"
                    style={{ boxShadow: "0 0 32px rgba(76, 107, 34, 0.6), 0 0 8px rgba(76, 107, 34, 0.3)" }}
                >
                    <p className="text-special text-2xl font-bold underline">No KYC</p>
                    <p className="text-special text-sm text-center font-semibold">No identity verification required. Sign up with just an email and a password.</p>
                </div>


                <div className="flex flex-col items-center text-center gap-1">
                    <p className="text-green-200 font-semibold text-lg">The lowest fees in the market.</p>
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


                <PointDown />
            </div>

            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            <div className="w-full max-w-lg mx-auto px-4 pb-12">
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

            <PointDown />

            <div className="w-full max-w-lg mx-auto px-4 pb-20">
                <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>

                <div className="flex flex-col gap-3">
                    {faqJsonLd.mainEntity.map((q, i) => (
                        <div key={i} className="info-card">
                            <p className="font-semibold text-sm">{q.name}</p>
                            <p className="text-gray-400 text-sm mt-1">{q.acceptedAnswer.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
