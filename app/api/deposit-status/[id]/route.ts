import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

//

// Maps DB status to the labels FinanceClient expects
const STATUS_MAP: Record<string, string> = {
    pending:   'waiting',
    confirmed: 'confirming',
    swept:     'finished',
    expired:   'expired',
}

//

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // id is the deposit address
    const deposit = await prisma.crypto_deposit.findUnique({
        where: { address: id },
    })

    if (!deposit || deposit.userId !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Mark expired if past expiry and still pending
    if (deposit.status === 'pending' && deposit.expiresAt < new Date()) {
        await prisma.crypto_deposit.update({
            where: { address: id },
            data: { status: 'expired' },
        })
        return NextResponse.json({ status: 'expired' })
    }

    return NextResponse.json({ status: STATUS_MAP[deposit.status] ?? deposit.status })
}
