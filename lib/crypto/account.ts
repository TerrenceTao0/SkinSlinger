import { createPublicClient, http } from 'viem'
import { polygon } from 'viem/chains'
import { mnemonicToAccount } from 'viem/accounts'

//

export function getPublicClient() {
    return createPublicClient({
        chain: polygon,
        transport: http(process.env.ALCHEMY_POLYGON_RPC!),
    })
}


export function getDepositAccount(index: number) {
    return mnemonicToAccount(process.env.DEPOSIT_MNEMONIC!, { addressIndex: index })
}


export function getDepositAddress(index: number): `0x${string}` {
    return getDepositAccount(index).address
}

