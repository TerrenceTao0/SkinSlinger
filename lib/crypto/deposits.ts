import { prisma } from '../db'
import { getDepositAddress, getPublicClient } from './account'
import { sweepUSDC } from './sweep'
import { parseAbiItem, parseUnits } from 'viem'

//

const USDC_ADDRESS = process.env.USDC_ADDRESS as `0x${string}`
const USDC_DECIMALS = 6
const EXPIRY_MINUTES = 20
const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')

const STATUS_MAP: Record<string, string> = {
    pending: 'waiting',
    confirmed: 'confirming',
    swept: 'finished',
    expired: 'expired',
}

//

export async function createDeposit(userId: string, amount: number) {
    if (!amount || amount < 1) throw new Error('Minimum deposit is $1.00')

    const counter = await prisma.deposit_counter.upsert({
        where: { id: 'global' },
        update: { value: { increment: 1 } },
        create: { id: 'global', value: 1, lastBlock: BigInt(0) },
    })


    const index = counter.value
    const address = await getDepositAddress(index)
    const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000)

    await prisma.crypto_deposit.create({
        data: { userId, address, index, amountUsdc: amount, expiresAt },
    })


    return { address, amount, expiresAt }
}


export async function getDepositStatus(address: string, userId: string): Promise<string | null> {
    const deposit = await prisma.crypto_deposit.findUnique({ where: { address } })

    if (!deposit || deposit.userId !== userId) return null

    if (deposit.status === 'pending' && deposit.expiresAt < new Date()) {
        await prisma.crypto_deposit.update({ where: { address }, data: { status: 'expired' } })
        return 'expired'
    }

    return STATUS_MAP[deposit.status] ?? deposit.status
}


export async function processDeposits(
    onCredit: (userId: string, amountUsdc: number) => Promise<void>,)
    : 
    Promise<{ processed: number }> {
        const client = getPublicClient()
        const currentBlock = await client.getBlockNumber()
            
        const counter = await prisma.deposit_counter.upsert({
            where: { id: 'global' },
            update: {},
            create: { id: 'global', value: 0, lastBlock: currentBlock as bigint },
        })


        const fromBlock = counter.lastBlock > BigInt(0) ? counter.lastBlock + BigInt(1) : currentBlock - BigInt(100)

        const pending = await prisma.crypto_deposit.findMany({
            where: { status: 'pending', expiresAt: { gt: new Date() } },
        })


        if (pending.length === 0) {
            await prisma.deposit_counter.update({ where: { id: 'global' }, data: { lastBlock: currentBlock } })

            return { processed: 0 }
        }


        const pendingAddresses = pending.map(d => d.address as `0x${string}`)

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

            const received = log.args.value ?? BigInt(0)
            const expected = parseUnits(String(deposit.amountUsdc), USDC_DECIMALS)

            // Accept if received amount is within 1% of expected 
            if (received < expected * BigInt(99) / BigInt(100)) continue

            await prisma.crypto_deposit.update({
                where: { id: deposit.id },
                data: { status: 'confirmed', txHash: log.transactionHash },
            })


            try {
                const sweepTx = await sweepUSDC(deposit.index, received)

                await prisma.crypto_deposit.update({
                    where: { id: deposit.id },
                    data: { status: 'swept', txHash: sweepTx },
                })


                await onCredit(deposit.userId, deposit.amountUsdc)
                processed++
            } 
            catch (err) {
                console.error(`[deposits] sweep failed for deposit ${deposit.id}:`, err)
            }
        }


        // Mark as expired but don't delete for edge case recovery
        await prisma.crypto_deposit.updateMany({
            where: { status: 'pending', expiresAt: { lt: new Date() } },
            data: { status: 'expired' },
        })


        await prisma.deposit_counter.update({ where: { id: 'global' }, data: { lastBlock: currentBlock } })

        return { processed }
}

