import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createWalletClient, http, erc20Abi, parseUnits } from 'viem'
import { polygon } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

//

const FEE_RATE = 0.02
const MIN_WITHDRAWAL = 5
const USDC_DECIMALS = 6

//

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, address } = await req.json()

    if (!amount || amount < MIN_WITHDRAWAL) {
        return NextResponse.json({ error: `Minimum withdrawal is $${MIN_WITHDRAWAL}.00` }, { status: 400 })
    }

    if (!address?.trim()) {
        return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    // Deduct balance atomically
    const updated = await prisma.user.updateMany({
        where: { id: session.user.id, cash: { gte: amount } },
        data: { cash: { decrement: amount } },
    })

    if (updated.count === 0) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    const netAmount = amount * (1 - FEE_RATE)
    const usdcAmount = parseUnits(netAmount.toFixed(USDC_DECIMALS), USDC_DECIMALS)

    try {
        const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`)

        const walletClient = createWalletClient({
            account,
            chain: polygon,
            transport: http(process.env.ALCHEMY_POLYGON_RPC!),
        })

        const txHash = await walletClient.writeContract({
            address: process.env.USDC_ADDRESS as `0x${string}`,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [address as `0x${string}`, usdcAmount],
        })

        return NextResponse.json({ txHash, usdcAmount: netAmount })
    } catch (err) {
        // Refund on failure
        await prisma.user.update({
            where: { id: session.user.id },
            data: { cash: { increment: amount } },
        })

        const message = err instanceof Error ? err.message : 'Withdrawal failed'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
