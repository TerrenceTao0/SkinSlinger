import { createWalletClient, http, erc20Abi } from 'viem'
import { polygon } from 'viem/chains'
import { getDepositAccount, getPublicClient } from './account'

// 

export async function sweepUSDC(index: number, amountUsdc: bigint): Promise<`0x${string}`> {
    console.log('[sweep] mnemonic words:', process.env.DEPOSIT_MNEMONIC?.split(' ').length)
    const account = getDepositAccount(index)
    console.log('[sweep] account address:', account.address)

    const walletClient = createWalletClient({
        account,
        chain: polygon,
        transport: http(process.env.ALCHEMY_POLYGON_RPC!),
    })


    const publicClient = getPublicClient()

    const { request } = await publicClient.simulateContract({
        address: process.env.USDC_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [process.env.MAIN_WALLET_ADDRESS as `0x${string}`, amountUsdc],
    })


    return walletClient.writeContract(request)
}

