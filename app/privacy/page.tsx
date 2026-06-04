import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy',
}

const sections = [
    {
        title: "1. Who We Are",
        body: `SkinSlinger ("we", "us", "our") operates the SkinSlinger platform at skinslinger.com. We are the data controller for personal data collected through the Platform. Our registered address is: Cobham House, 9 Warwick Court, Midtown, WC1R 5DJ, United Kingdom. Contact: support@skinslinger.com.`,
    },
    {
        title: "2. Data We Collect",
        body: `We collect: email address and username (at registration); password (stored as a bcrypt hash — we never store your plaintext password); Steam ID and Steam trade URL (when you link your Steam account); transaction history including deposits, withdrawals, purchases, and sales; IP address and basic usage data for security and fraud prevention; and two-factor authentication codes (temporarily, for login verification only).`,
    },
    {
        title: "3. How We Use Your Data",
        body: `We use your data to: operate your account and process transactions; verify your Steam trade eligibility; send transactional emails (purchase notifications, 2FA codes, password resets) via Resend; prevent fraud and abuse; and comply with our legal obligations.`,
    },
    {
        title: "4. Legal Basis (UK GDPR)",
        body: `We process your data under the following lawful bases: Contract — processing necessary to provide the service you signed up for; Legitimate Interests — fraud prevention, security, and platform integrity; Legal Obligation — where required by applicable law.`,
    },
    {
        title: "5. Data Sharing",
        body: `We do not sell your personal data. We share data only with: Resend (transactional email delivery); Vercel (hosting and analytics); and Steam/Valve (solely to verify your inventory and trade eligibility via the Steam Web API). We do not share data with advertisers or third-party marketing services.`,
    },
    {
        title: "6. Data Retention",
        body: `We retain your account data for as long as your account is active. Transaction records are retained for 7 years for financial compliance purposes. You may request deletion of your account and associated data at any time by contacting support@skinslinger.com, subject to retention obligations.`,
    },
    {
        title: "7. Your Rights",
        body: `Under UK GDPR you have the right to: access the personal data we hold about you; correct inaccurate data; request deletion of your data ("right to be forgotten"); restrict or object to processing; and data portability. To exercise any of these rights, contact support@skinslinger.com. You also have the right to lodge a complaint with the Information Commissioner's Office (ICO) at ico.org.uk.`,
    },
    {
        title: "8. Cookies",
        body: `We use only strictly necessary cookies for session management and authentication. We do not use tracking or advertising cookies.`,
    },
    {
        title: "9. Security",
        body: `We use industry-standard measures including encrypted connections (HTTPS), hashed passwords, and JWT-based authentication. No system is completely secure — please use a strong, unique password and keep your account credentials confidential.`,
    },
    {
        title: "10. Changes to This Policy",
        body: `We may update this Privacy Policy from time to time. We will notify users of material changes via email or a notice on the Platform. Continued use after changes constitutes acceptance of the updated policy.`,
    },
]

export default function PrivacyPage() {
    return (
        <div className="overflow-y-auto h-full w-full no-scrollbar">
            <div className="w-full max-w-2xl mx-auto px-4 pt-24 pb-20">
                <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
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
