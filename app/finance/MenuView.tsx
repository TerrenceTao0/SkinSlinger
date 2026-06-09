export default function MenuView({
    balance,
    onDeposit,
    onWithdraw,
}: {
    balance: number
    onDeposit: () => void
    onWithdraw: () => void
}) {
    return (
        <div className="h-full w-full flex justify-center items-center">
            <div className="w-full max-w-sm flex flex-col gap-5 justify-center items-center">
                <div className="bg-secondary rounded-sm px-5 py-4 flex flex-col gap-0.5 w-90 md:w-full">
                    <span className="text-[11px] uppercase tracking-widest text-gray-500">
                        Available Balance
                    </span>

                    <span className="text-3xl font-semibold">
                        ${balance.toFixed(2)}
                    </span>
                </div>

                <div className="flex flex-col gap-5 justify-center items-center w-full">
                    <button onClick={onDeposit} className="bg-secondary rounded-sm px-5 py-4 flex items-center gap-4 text-left button transition-colors w-90 md:w-full">
                        <span className="w-9 h-9 rounded-sm bg-special/20 flex items-center justify-center shrink-0 text-special text-xl">
                            ↓
                        </span>

                        <div className="flex flex-col gap-0.5">
                            <span className="font-medium">
                                Deposit
                            </span>

                            <span className="text-sm text-gray-400">
                                Add funds via USDC on Polygon
                            </span>
                        </div>

                        <span className="ml-auto text-gray-600 text-lg">
                            ›
                        </span>
                    </button>

                    <button onClick={onWithdraw} className="bg-secondary rounded-sm px-5 py-4 flex items-center gap-4 text-left button transition-colors w-90 md:w-full">
                        <span className="w-9 h-9 rounded-sm bg-accent flex items-center justify-center shrink-0 text-lg">
                            ↑
                        </span>
                       
                        <div className="flex flex-col gap-0.5">
                            <span className="font-medium">
                                Withdraw
                            </span>
                            
                            <span className="text-sm text-gray-400">
                                Send USDC to your wallet
                            </span>
                        </div>

                        <span className="ml-auto text-gray-600 text-lg">
                            ›
                        </span>
                    </button>
                </div>

                <div className="bg-secondary rounded-sm px-5 py-4 flex flex-col gap-2 w-90 md:w-full">
                    <span className="text-[11px] uppercase tracking-widest text-gray-500">
                        How it works
                    </span>
                    
                    <ul className="flex flex-col gap-1.5 text-sm text-gray-400">
                        <li>Deposits and withdrawals use USDC on the Polygon network only</li>
                        <li>Your balance updates when the transaction is confirmed</li>
                        <li>Minimum withdrawal is $1.00</li>
                        <li>Withdrawals incur a base 2% processing fee</li>
                        <li>Never send funds from a different network as they cannot be recovered</li>
                    </ul>
                </div>

            </div>
        </div>
    )
}

