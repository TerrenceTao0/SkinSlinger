import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

//

const FEE_RATE = 0.02 // 2%
const MIN_WITHDRAWAL = 5

//

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, address } = await req.json()
    const currency = 'usdcmatic'

    if (!amount || amount < MIN_WITHDRAWAL) {
        return NextResponse.json({ error: `Minimum withdrawal is $${MIN_WITHDRAWAL}.00` }, { status: 400 })
    }

    if (!address?.trim()) {
        return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    // Deduct balance atomically — updateMany returns count 0 if balance insufficient
    const updated = await prisma.user.updateMany({
        where: { id: session.user.id, cash: { gte: amount } },
        data: { cash: { decrement: amount } },
    })

    if (updated.count === 0) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    const netUsd = amount * (1 - FEE_RATE)

    try {
        // Get crypto amount estimate
        const estimateRes = await fetch(
            `https://api.nowpayments.io/v1/estimate?amount=${netUsd}&currency_from=usd&currency_to=${currency}`,
            { headers: { 'x-api-key': process.env.NOWPAYMENTS_API_KEY! } }
        )

        if (!estimateRes.ok) throw new Error('Failed to get exchange rate')

        const { estimated_amount: cryptoAmount } = await estimateRes.json()

        // Authenticate with NOWPayments to get JWT for payouts
        const authRes = await fetch('https://api.nowpayments.io/v1/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: process.env.NOWPAYMENTS_EMAIL!,
                password: process.env.NOWPAYMENTS_PASSWORD!,
            }),
        })

        if (!authRes.ok) throw new Error('Payment provider auth failed')

        const { token } = await authRes.json()

        // Create payout
        const payoutRes = await fetch('https://api.nowpayments.io/v1/payout', {
            method: 'POST',
            headers: {
                'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ipn_callback_url: `${process.env.NEXTAUTH_URL}/api/webhooks/nowpayments`,
                withdrawals: [{ address, currency, amount: cryptoAmount }],
            }),
        })

        if (!payoutRes.ok) {
            const err = await payoutRes.json()
            throw new Error(err.message ?? 'Payout failed')
        }

        return NextResponse.json({ cryptoAmount, currency })
    }
    catch (err) {
        // Refund the deducted balance
        await prisma.user.update({
            where: { id: session.user.id },
            data: { cash: { increment: amount } },
        })

        const message = err instanceof Error ? err.message : 'Withdrawal failed'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
