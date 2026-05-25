import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

//

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

//

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }


    const { amount } = await req.json()

    if (!amount || amount < 500) {
        return NextResponse.json({ error: 'Minimum deposit is $5.00' }, { status: 400 })
    }


    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            payment_method_types: ['card', 'link'],
            metadata: { userId: session.user.id },
        })


        return NextResponse.json({ clientSecret: paymentIntent.client_secret })
    } 
    catch (err) {
        const message = err instanceof Error ? err.message : 'Stripe error'
        console.error('[create-payment-intent]', message)

        return NextResponse.json({ error: message }, { status: 500 })
    }
}

