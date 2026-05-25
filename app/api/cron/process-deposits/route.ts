import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPublicClient } from '@/lib/crypto/account'
import { sweepUsdc } from '@/lib/crypto/sweep'
import { parseAbiItem, parseUnits } from 'viem'

//

const USDC_ADDRESS = process.env.USDC_ADDRESS as `0x${string}`
const USDC_DECIMALS = 6
const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')

//

export async function GET(req: Request) {
    if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = getPublicClient()

    // Get current block and last processed block
    const currentBlock = await client.getBlockNumber()

    const counter = await prisma.deposit_counter.upsert({
        where: { id: 'global' },
        update: {},
        create: { id: 'global', value: 0, lastBlock: currentBlock },
    })

    const fromBlock = counter.lastBlock > 0n ? counter.lastBlock + 1n : currentBlock - 100n

    // Get all pending deposits that haven't expired
    const pending = await prisma.crypto_deposit.findMany({
        where: { status: 'pending', expiresAt: { gt: new Date() } },
    })

    if (pending.length === 0) {
        await prisma.deposit_counter.update({
            where: { id: 'global' },
            data: { lastBlock: currentBlock },
        })
        return NextResponse.json({ processed: 0 })
    }

    const pendingAddresses = pending.map(d => d.address as `0x${string}`)

    // Check for USDC transfers to any pending deposit address
    const logs = await client.getLogs({
        address: USDC_ADDRESS,
        event: TRANSFER_EVENT,
        args: { to: pendingAddresses },
        fromBlock,
        toBlock: currentBlock,
    })

    let processed = 0

    for (const log of logs) {
        const deposit = pending.find(d => d.address.toLowerCase() === log.args.to?.toLowerCase())
        if (!deposit) continue

        const received = log.args.value ?? 0n
        const expected = parseUnits(String(deposit.amountUsdc), USDC_DECIMALS)

        // Accept if received amount is within 1% of expected (handles rounding)
        if (received < expected * 99n / 100n) continue

        // Mark confirmed and sweep
        await prisma.crypto_deposit.update({
            where: { id: deposit.id },
            data: { status: 'confirmed', txHash: log.transactionHash },
        })

        try {
            const sweepTx = await sweepUsdc(deposit.index, received)

            await prisma.$transaction([
                prisma.crypto_deposit.update({
                    where: { id: deposit.id },
                    data: { status: 'swept', txHash: sweepTx },
                }),
                prisma.user.update({
                    where: { id: deposit.userId },
                    data: { cash: { increment: deposit.amountUsdc } },
                }),
            ])

            processed++
        } catch (err) {
            console.error(`[process-deposits] sweep failed for deposit ${deposit.id}:`, err)
            // Leave as 'confirmed' — will retry on next cron run
        }
    }

    // Expire overdue deposits
    await prisma.crypto_deposit.updateMany({
        where: { status: 'pending', expiresAt: { lt: new Date() } },
        data: { status: 'expired' },
    })

    // Advance the last processed block
    await prisma.deposit_counter.update({
        where: { id: 'global' },
        data: { lastBlock: currentBlock },
    })

    return NextResponse.json({ processed })
}
