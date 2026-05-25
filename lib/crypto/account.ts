import { createPublicClient, http } from 'viem'
import { polygon } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { toSimpleSmartAccount } from 'permissionless/accounts'
import { entryPoint06Address } from 'viem/account-abstraction'

//

export function getPublicClient() {
    return createPublicClient({
        chain: polygon,
        transport: http(process.env.ALCHEMY_POLYGON_RPC!),
    })
}

// Returns the SimpleAccount for a given deposit index.
// The same master key owns all accounts — only the index (salt) differs.
export async function getDepositAccount(index: number) {
    const owner = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`)

    return toSimpleSmartAccount({
        client: getPublicClient(),
        owner,
        index: BigInt(index),
        entryPoint: {
            address: entryPoint06Address,
            version: '0.6',
        },
    })
}

// Returns just the deposit address without instantiating the full account client.
export async function getDepositAddress(index: number): Promise<`0x${string}`> {
    const account = await getDepositAccount(index)
    return account.address
}
