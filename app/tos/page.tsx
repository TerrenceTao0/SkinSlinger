import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Terms of Service',
}

const sections = [
    {
        title: "1. Acceptance of Terms",
        body: `By accessing or using SkinSlinger ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform. We may update these Terms at any time; continued use after changes constitutes acceptance.`,
    },
    {
        title: "2. Description of Service",
        body: `SkinSlinger is a peer-to-peer marketplace that allows users to buy and sell in-game cosmetic items ("skins") for CS2, Dota 2, Rust, and Team Fortress 2 via Steam trade offers. SkinSlinger is not affiliated with, endorsed by, or in any way officially connected with Valve Corporation or Steam.`,
    },
    {
        title: "3. Eligibility",
        body: `You must be at least 18 years old (or the age of majority in your jurisdiction, if higher) to use the Platform. By registering, you confirm that you meet this requirement. We reserve the right to terminate accounts found to be in breach of this requirement.`,
    },
    {
        title: "4. Account Registration",
        body: `You are responsible for maintaining the confidentiality of your account credentials. You are solely responsible for all activity that occurs under your account. You must provide accurate information at registration and keep it up to date. We reserve the right to suspend or terminate accounts at our discretion.`,
    },
    {
        title: "5. Financial Terms",
        body: `SkinSlinger holds user balances in USDC (Polygon Network). By depositing funds, you authorise us to hold and transact on your behalf within the Platform. Withdrawals are subject to a 2% fee. All other fees (sales, deposits, FX) are 0%. Crypto transactions are irreversible — we are not responsible for funds sent to incorrect addresses or lost due to user error. Balances are not insured and do not earn interest.`,
    },
    {
        title: "6. Trading Rules",
        body: `Sellers are responsible for sending Steam trade offers promptly after a sale. Buyers must accept trade offers within a reasonable time. If a seller fails to deliver an item, the buyer will receive a full refund. SkinSlinger verifies trades automatically by checking the buyer's Steam inventory. If the buyer's inventory is private, the trade will be assumed complete. Users are responsible for ensuring their Steam account is trade-eligible.`,
    },
    {
        title: "7. Prohibited Conduct",
        body: `You must not: attempt to manipulate prices or listings; use the Platform for money laundering or any illegal activity; create multiple accounts to circumvent restrictions; reverse-engineer or scrape the Platform; or list items you do not own or that are subject to trade bans. Violation of these rules may result in immediate account termination and forfeiture of balance.`,
    },
    {
        title: "8. Disclaimers & Limitation of Liability",
        body: `The Platform is provided "as is" without warranties of any kind. SkinSlinger is not liable for losses arising from Steam trade bans, VAC bans, Valve policy changes, blockchain network failures, smart contract exploits, or any interruption of service. To the fullest extent permitted by law, our total liability to you shall not exceed the balance held in your account at the time of the claim.`,
    },
    {
        title: "9. Governing Law",
        body: `These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.`,
    },
    {
        title: "10. Contact",
        body: `For questions regarding these Terms, contact us at support@skinslinger.com or write to: SkinSlinger, Cobham House, 9 Warwick Court, Midtown, WC1R 5DJ, United Kingdom.`,
    },
]

export default function TosPage() {
    return (
        <div className="overflow-y-auto h-full w-full no-scrollbar">
            <div className="w-full max-w-2xl mx-auto px-4 pt-24 pb-20">
                <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
                <p className="text-gray-500 text-sm mb-10">Last updated: June 2025</p>

                <div className="flex flex-col gap-6">
                    {sections.map(({ title, body }) => (
                        <div key={title}>
                            <h2 className="font-semibold text-sm mb-1">{title}</h2>
                            <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
