import Image from 'next/image'

export default function DepositAmountView({
    amountInput,
    onAmountChange,
    error,
    loading,
    onSubmit,
}: {
    amountInput: string
    onAmountChange: (v: string) => void
    error: string
    loading: boolean
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}) {
    return (
        <div className="h-full w-full flex justify-center items-center">
            <div className="w-100 bg-secondary p-6 frame-shadow rounded-[5px]">
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                    <div className="flex items-center justify-center gap-2">
                        <Image src="/usdc.png" alt="USDC" width={24} height={24} />
                        <p className="text-sm text-gray-400">Deposit via USDC (Polygon Network)</p>
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

                    <p className="text-xs text-yellow-500 text-center">
                        Only send USDC on the Polygon network. Sending on any other network will result in permanent loss of funds.
                    </p>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <button type="submit" disabled={loading} className="bg-special w-full h-10 rounded-[5px] button">
                        {loading ? "Loading..." : "Continue"}
                    </button>
                </form>
            </div>
        </div>
    )
}
