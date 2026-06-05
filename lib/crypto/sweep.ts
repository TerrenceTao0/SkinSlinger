import { createWalletClient, http, erc20Abi, parseEther } from 'viem'
import { polygon } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { getDepositAccount, getPublicClient } from './account'

//

const GAS_THRESHOLD = parseEther('0.004')
const GAS_FUND_AMOUNT = parseEther('0.005')

export async function sweepUSDC(index: number, amountUsdc: bigint): Promise<`0x${string}`> {
    const account = getDepositAccount(index)
    const rpc = process.env.ALCHEMY_POLYGON_RPC!

    const maticBalance = await getPublicClient().getBalance({ address: account.address })

    if (maticBalance < GAS_THRESHOLD) {
        const mainAccount = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`)
        const funder = createWalletClient({ account: mainAccount, chain: polygon, transport: http(rpc) })
        await funder.sendTransaction({ to: account.address, value: GAS_FUND_AMOUNT })
    }

    const walletClient = createWalletClient({
        account,
        chain: polygon,
        transport: http(rpc),
    })

    return walletClient.writeContract({
        address: process.env.USDC_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [process.env.MAIN_WALLET_ADDRESS as `0x${string}`, amountUsdc],
    })
}

