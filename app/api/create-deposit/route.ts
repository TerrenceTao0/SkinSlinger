import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDepositAddress } from '@/lib/crypto/account'

//

const EXPIRY_MINUTES = 20

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

    // Atomically increment the deposit index counter
    const counter = await prisma.deposit_counter.upsert({
        where: { id: 'global' },
        update: { value: { increment: 1 } },
        create: { id: 'global', value: 1, lastBlock: 0n },
    })

    const index = counter.value
    const address = await getDepositAddress(index)
    const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000)

    // USDC has 6 decimals — amount is USD which equals USDC 1:1
    const amountUsdc = amount

    await prisma.crypto_deposit.create({
        data: {
            userId: session.user.id,
            address,
            index,
            amountUsdc,
            expiresAt,
        },
    })

    return NextResponse.json({ depositId: address, payAddress: address, payAmount: amountUsdc })
}
