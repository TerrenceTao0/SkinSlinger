import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

//

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount } = await req.json()

    if (!amount || amount < 1) {
        return NextResponse.json({ error: 'Minimum deposit is $1.00' }, { status: 400 })
    }

    const res = await fetch('https://api.nowpayments.io/v1/payment', {
        method: 'POST',
        headers: {
            'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            price_amount: amount,
            price_currency: 'usd',
            pay_currency: 'usdcmatic',
            order_id: session.user.id,
            ipn_callback_url: `${process.env.NEXTAUTH_URL}/api/webhooks/nowpayments`,
        }),
    })

    if (!res.ok) {
        const err = await res.json()
        return NextResponse.json({ error: err.message ?? 'Failed to create payment' }, { status: 500 })
    }

    const data = await res.json()

    return NextResponse.json({
        paymentId: data.payment_id,
        payAddress: data.pay_address,
        payAmount: data.pay_amount,
        payCurrency: data.pay_currency,
    })
}
