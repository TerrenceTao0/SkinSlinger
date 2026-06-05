export default function WithdrawSuccessView({ usdcAmount, onDone }: { usdcAmount: number, onDone: () => void }) {
    return (
        <div className="h-full w-full flex justify-center items-center">
            <div className="w-100 flex flex-col justify-center items-center bg-secondary gap-4 frame-shadow rounded-[5px] p-8">
                <p className="text-lg font-medium">Withdrawal initiated!</p>
                <p className="text-sm text-gray-400 text-center">{usdcAmount} USDC is on its way to your wallet.</p>
                <button className="bg-special w-40 h-10 rounded-[5px] button" onClick={onDone}>Done</button>
            </div>
        </div>
    )
}
