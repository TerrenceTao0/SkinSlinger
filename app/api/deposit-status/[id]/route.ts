import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { completeDeposit } from '@/lib/completeDeposit'

//

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const res = await fetch(`https://api.nowpayments.io/v1/payment/${id}`, {
        headers: { 'x-api-key': process.env.NOWPAYMENTS_API_KEY! },
    })

    if (!res.ok) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const data = await res.json()

    if (data.payment_status === 'finished') {
        await completeDeposit(
            String(data.payment_id),
            session.user.id,
            data.price_amount as number,
        )
    }

    return NextResponse.json({ status: data.payment_status })
}
