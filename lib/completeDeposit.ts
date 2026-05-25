import { prisma } from './db'

// Credits the user's balance for a NOWPayments payment.
// Idempotent — safe to call from both the webhook and the poll route.
// Returns true if the balance was credited, false if already processed.
export async function completeDeposit(paymentId: string, userId: string, amount: number): Promise<boolean> {
    try {
        await prisma.$transaction(async (tx) => {
            await tx.deposit.create({ data: { id: paymentId, userId, amount } })
            await tx.user.update({ where: { id: userId }, data: { cash: { increment: amount } } })
        })
        return true
    } catch (e: unknown) {
        // P2002 = unique constraint violation — already processed
        if ((e as { code?: string }).code === 'P2002') return false
        throw e
    }
}
