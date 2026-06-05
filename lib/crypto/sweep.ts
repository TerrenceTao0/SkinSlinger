import { createWalletClient, http, erc20Abi } from 'viem'
import { polygon } from 'viem/chains'
import { getDepositAccount } from './account'

// 

export async function sweepUSDC(index: number, amountUsdc: bigint): Promise<`0x${string}`> {
    const account = getDepositAccount(index)

    const walletClient = createWalletClient({
        account,
        chain: polygon,
        transport: http(process.env.ALCHEMY_POLYGON_RPC!),
    })


    return walletClient.writeContract({
        address: process.env.USDC_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [process.env.MAIN_WALLET_ADDRESS as `0x${string}`, amountUsdc],
    })
}

