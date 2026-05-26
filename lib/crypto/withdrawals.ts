import { createWalletClient, http, erc20Abi, parseUnits } from 'viem'
import { polygon } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

//

const FEE_RATE = 0.02
const MIN_WITHDRAWAL = 1
const USDC_DECIMALS = 6

//

// Sends USDC from the main wallet to `toAddress` (minus fee), then sends the fee to USDC_PROFIT_ADDRESS.
//
// deductBalance() — atomically deduct `amount` from the user; return false if insufficient.
// refundBalance() — called if the on-chain transfer fails so the user is made whole.
//
// Throws on validation failure or insufficient balance.
// Returns { txHash, usdcAmount } where usdcAmount is the net USDC received by the user.
export async function processWithdrawal(
    amount: number,
    toAddress: string,
    deductBalance: () => Promise<boolean>,
    refundBalance: () => Promise<void>,
): Promise<{ txHash: `0x${string}`; usdcAmount: number }> {
    if (!amount || amount < MIN_WITHDRAWAL) throw new Error(`Minimum withdrawal is $${MIN_WITHDRAWAL}.00`)
    if (!toAddress?.trim()) throw new Error('Wallet address required')

    const ok = await deductBalance()
    if (!ok) throw new Error('Insufficient balance')

    const netAmount = amount * (1 - FEE_RATE)
    const feeAmount = amount * FEE_RATE
    const usdcAmount = parseUnits(netAmount.toFixed(USDC_DECIMALS), USDC_DECIMALS)
    const usdcFee = parseUnits(feeAmount.toFixed(USDC_DECIMALS), USDC_DECIMALS)

    const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`)
    const walletClient = createWalletClient({
        account,
        chain: polygon,
        transport: http(process.env.ALCHEMY_POLYGON_RPC!),
    })

    // Transfer USDC to user — refund cash if this fails
    let txHash: `0x${string}`
    try {
        txHash = await walletClient.writeContract({
            address: process.env.USDC_ADDRESS as `0x${string}`,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [toAddress as `0x${string}`, usdcAmount],
        })
    } catch (err) {
        await refundBalance()
        throw err
    }

    // Collect fee — user already has their USDC, do not refund on failure
    try {
        await walletClient.writeContract({
            address: process.env.USDC_ADDRESS as `0x${string}`,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [process.env.USDC_PROFIT_ADDRESS as `0x${string}`, usdcFee],
        })
    } catch (err) {
        console.error('[withdrawals] fee transfer failed:', err)
    }

    return { txHash, usdcAmount: netAmount }
}
