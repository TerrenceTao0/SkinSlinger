import { http, encodeFunctionData, erc20Abi } from 'viem'
import { polygon } from 'viem/chains'
import { createSmartAccountClient } from 'permissionless'
import { createPimlicoClient } from 'permissionless/clients/pimlico'
import { entryPoint06Address } from 'viem/account-abstraction'
import { getDepositAccount } from './account'

//

function getPimlicoClient() {
    return createPimlicoClient({
        transport: http(`https://api.pimlico.io/v2/polygon/rpc?apikey=${process.env.PIMLICO_API_KEY}`),
        entryPoint: {
            address: entryPoint06Address,
            version: '0.6',
        },
    })
}

// Sweeps all USDC from the deposit address at `index` to the main wallet.
// Gas is sponsored by Pimlico — the deposit address needs no MATIC.
// Returns the transaction hash.
export async function sweepUsdc(index: number, amountUsdc: bigint): Promise<`0x${string}`> {
    const account = await getDepositAccount(index)
    const pimlico = getPimlicoClient()

    const client = createSmartAccountClient({
        account,
        chain: polygon,
        bundlerTransport: http(`https://api.pimlico.io/v2/polygon/rpc?apikey=${process.env.PIMLICO_API_KEY}`),
        paymaster: pimlico,
    })

    const txHash = await client.sendTransaction({
        to: process.env.USDC_ADDRESS as `0x${string}`,
        data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'transfer',
            args: [
                process.env.MAIN_WALLET_ADDRESS as `0x${string}`,
                amountUsdc,
            ],
        }),
        value: BigInt(0),
    })

    return txHash
}
