import { createWalletClient, http, erc20Abi, parseUnits } from 'viem'
import { polygon } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

//

const FEE_RATE = 0.02
const MIN_WITHDRAWAL = 1
const USDC_DECIMALS = 6

//

export async function processWithdrawal(
    amount: number,
    toAddress: string,
    deductBalance: () => Promise<boolean>,
    refundBalance: () => Promise<void>,
    )
    :
    Promise<{ transactionHash: `0x${string}`; usdcAmount: number }> {
        if (!amount || amount < MIN_WITHDRAWAL) throw new Error(`Minimum withdrawal is $${MIN_WITHDRAWAL}.00`)
            
        if (!toAddress?.trim()) throw new Error('Wallet address required')

        const ok = await deductBalance()

        if (!ok) throw new Error('Insufficient balance')

        const feeAmount = amount * FEE_RATE
        const netAmount = amount - feeAmount
        const usdcAmount = parseUnits(netAmount.toFixed(USDC_DECIMALS), USDC_DECIMALS)
        const usdcFee = parseUnits(feeAmount.toFixed(USDC_DECIMALS), USDC_DECIMALS)

        const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`)

        const walletClient = createWalletClient({
            account,
            chain: polygon,
            transport: http(process.env.ALCHEMY_POLYGON_RPC!),
        })


        let transactionHash: `0x${string}`

        try {
            transactionHash = await walletClient.writeContract({
                address: process.env.USDC_ADDRESS as `0x${string}`,
                abi: erc20Abi,
                functionName: 'transfer',
                args: [toAddress as `0x${string}`, usdcAmount],
            })
        } 
        catch (err) {
            await refundBalance()

            throw err
        }


        try {
            await walletClient.writeContract({
                address: process.env.USDC_ADDRESS as `0x${string}`,
                abi: erc20Abi,
                functionName: 'transfer',
                args: [process.env.USDC_PROFIT_ADDRESS as `0x${string}`, usdcFee],
            })
        } 
        catch (err) {
            console.error('[withdrawals] fee transfer failed:', err)
        }


        return { transactionHash, usdcAmount: netAmount }
}

