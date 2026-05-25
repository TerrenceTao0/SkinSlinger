import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { completeDeposit } from '@/lib/completeDeposit'

//

export async function POST(req: Request) {
    const body = await req.text()
    const sig = req.headers.get('x-nowpayments-sig')

    if (!sig) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const parsed = JSON.parse(body)

    // NOWPayments signs the body with keys sorted alphabetically
    const sorted = Object.keys(parsed)
        .sort()
        .reduce((acc, key) => { acc[key] = parsed[key]; return acc }, {} as Record<string, unknown>)

    const expected = createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET!)
        .update(JSON.stringify(sorted))
        .digest('hex')

    if (expected !== sig) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    if (parsed.payment_status === 'finished') {
        await completeDeposit(
            String(parsed.payment_id),
            parsed.order_id as string,
            parsed.price_amount as number,
        )
    }

    return NextResponse.json({ received: true })
}
