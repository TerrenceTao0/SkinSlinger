import { http, encodeFunctionData, erc20Abi, createWalletClient, createPublicClient, parseAbi } from 'viem'
import { polygon } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { getDepositAccount } from './account'

//

const FACTORY_ADDRESS = '0x9406Cc6185a346906296840746125a0E44976454' as const

const FACTORY_ABI = parseAbi([
    'function createAccount(address owner, uint256 salt) returns (address)',
])

const SIMPLE_ACCOUNT_ABI = parseAbi([
    'function execute(address dest, uint256 value, bytes calldata func) external',
])

// Sweeps all USDC from the deposit address at `index` to the main wallet.
// Deploys the SimpleAccount if not yet deployed, then calls execute() as owner.
// Gas (MATIC) is paid by the owner wallet.
export async function sweepUsdc(index: number, amountUsdc: bigint): Promise<`0x${string}`> {
    const account = await getDepositAccount(index)
    const owner = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`)

    const transport = http(process.env.ALCHEMY_POLYGON_RPC)

    const publicClient = createPublicClient({ chain: polygon, transport })
    const walletClient = createWalletClient({ account: owner, chain: polygon, transport })

    // Deploy the SimpleAccount if not yet on-chain
    const code = await publicClient.getBytecode({ address: account.address })
    if (!code || code === '0x') {
        const deployTx = await walletClient.writeContract({
            address: FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            functionName: 'createAccount',
            args: [owner.address, BigInt(index)],
        })
        await publicClient.waitForTransactionReceipt({ hash: deployTx })
    }

    // Transfer USDC via execute()
    const txHash = await walletClient.writeContract({
        address: account.address,
        abi: SIMPLE_ACCOUNT_ABI,
        functionName: 'execute',
        args: [
            process.env.USDC_ADDRESS as `0x${string}`,
            BigInt(0),
            encodeFunctionData({
                abi: erc20Abi,
                functionName: 'transfer',
                args: [
                    process.env.MAIN_WALLET_ADDRESS as `0x${string}`,
                    amountUsdc,
                ],
            }),
        ],
    })

    return txHash
}
