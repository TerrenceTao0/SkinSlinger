import Image from 'next/image'
import { WITHDRAWAL_FEE } from './types'

export default function WithdrawView({
    amountInput,
    onAmountChange,
    address,
    onAddressChange,
    error,
    loading,
    onSubmit,
}: {
    amountInput: string
    onAmountChange: (v: string) => void
    address: string
    onAddressChange: (v: string) => void
    error: string
    loading: boolean
    onSubmit: (e: React.FormEvent) => void
}) {
    const amount = parseFloat(amountInput) || 0
    const fee = amount * WITHDRAWAL_FEE
    const net = amount - fee

    return (
        <div className="h-full w-full flex justify-center items-center">
            <div className="w-100 bg-secondary p-6 frame-shadow rounded-[5px]">
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                    <div className="flex items-center justify-center gap-2">
                        <Image src="/usdc.png" alt="USDC" width={24} height={24} />
                        <p className="text-sm text-gray-400">Withdraw to USDC (Polygon Network)</p>
                    </div>

                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input
                            type="number"
                            min="1"
                            step="0.01"
                            placeholder="0.00"
                            value={amountInput}
                            onChange={e => onAmountChange(e.target.value)}
                            className="w-full pl-7 pr-3 py-2 bg-primary border border-gray-600 rounded-[5px]"
                            required
                            autoFocus
                        />
                    </div>

                    <input
                        type="text"
                        placeholder="Your USDC (Polygon) wallet address"
                        value={address}
                        onChange={e => onAddressChange(e.target.value)}
                        className="w-full px-3 py-2 bg-primary border border-gray-600 rounded-[5px] text-sm"
                        required
                    />

                    {amount >= 1 && (
                        <div className="bg-primary rounded-sm px-3 py-2 flex flex-col gap-1 text-sm">
                            <div className="flex justify-between text-gray-400">
                                <span>Amount</span>
                                <span>${amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                                <span>Fee (2%)</span>
                                <span>-${fee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-medium border-t border-gray-700 pt-1 mt-1">
                                <span>You receive</span>
                                <span>${net.toFixed(2)} USDC</span>
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-yellow-500 text-center">
                        Make sure your wallet address is on the Polygon network. Withdrawals sent to the wrong network cannot be recovered.
                    </p>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <button type="submit" disabled={loading} className="bg-special w-full h-10 rounded-[5px] button">
                        {loading ? "Processing..." : "Withdraw"}
                    </button>
                </form>
            </div>
        </div>
    )
}
