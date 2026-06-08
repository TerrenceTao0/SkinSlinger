import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { processWithdrawal } from '@/lib/crypto'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount, address } = await req.json()
    const userId = session.user.id

    try {
        const result = await processWithdrawal(
            amount,
            address,
            async () => {
                const updated = await prisma.user.updateMany({
                    where: { id: userId, cash: { gte: amount } },
                    data: { cash: { decrement: amount } },
                })
                return updated.count > 0
            },
            async () => {
                await prisma.user.update({
                    where: { id: userId },
                    data: { cash: { increment: amount } },
                })
            },
        )

        
        return NextResponse.json(result)
    } 
    catch (err) {
        const message = err instanceof Error ? err.message : 'Withdrawal failed'
        const status = message === 'Insufficient balance' || message.startsWith('Minimum') ? 400 : 500
        return NextResponse.json({ error: message }, { status })
    }
}
