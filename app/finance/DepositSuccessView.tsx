export default function DepositSuccessView({ onDone }: { onDone: () => void }) {
    return (
        <div className="h-full w-full flex justify-center items-center">
            <div className="w-100 h-60 flex flex-col justify-center items-center bg-secondary gap-4 frame-shadow rounded-[5px]">
                <p className="text-lg font-medium">Payment received!</p>
                <p className="text-sm text-gray-400">Your balance will update shortly.</p>
                <button className="bg-special w-40 h-10 rounded-[5px] button" onClick={onDone}>Done</button>
            </div>
        </div>
    )
}
