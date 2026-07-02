import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import FinanceClient from "./FinanceClient"
import type { Metadata } from 'next'

//

export const metadata: Metadata = {
    title: 'Finance',
    robots: { index: false, follow: false },
}

export default async function Finance() {
    const session = await getServerSession(authOptions)

    // Funds from sales still inside their 7-day clearing window — held, not yet spendable.
    let pendingBalance = 0
    // Funds already spent on purchases that haven't completed yet (pending or clearing) —
    // already deducted from cash, so not part of the available balance.
    let lockedBalance = 0
    if (session?.user?.id) {
        const held = await prisma.purchase.aggregate({
            where: { sellerId: session.user.id, status: "holding" },
            _sum: { price: true },
        })
        pendingBalance = held._sum.price ?? 0

        const locked = await prisma.purchase.aggregate({
            where: { buyerId: session.user.id, status: { in: ["pending", "holding"] } },
            _sum: { price: true },
        })
        lockedBalance = locked._sum.price ?? 0
    }

    return <Suspense><FinanceClient pendingBalance={pendingBalance} lockedBalance={lockedBalance} /></Suspense>
}

