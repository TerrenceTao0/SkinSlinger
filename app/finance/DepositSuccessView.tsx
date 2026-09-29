import Link from 'next/link'
import { CheckIcon } from './ui'

//

export default function DepositSuccessView({ onDone }: { onDone: () => void }) {
    return (
        <div className="w-full max-w-md bg-secondary rounded-sm frame-shadow p-8 flex flex-col items-center text-center gap-4">
            <span className="w-14 h-14 rounded-full bg-special/15 ring-1 ring-special/40 flex items-center justify-center">
                <CheckIcon className="w-7 h-7 text-special" />
            </span>

            <div className="flex flex-col gap-1">
                <h1 className="text-xl font-bold">
                    Deposit received
                </h1>

                <p className="text-sm text-gray-400">
                    The funds have been added to your balance.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full mt-2">
                <button onClick={onDone} className="bg-accent button h-11 rounded-sm font-medium">
                    Back to wallet
                </button>

                <Link href="/market" className="bg-special button h-11 rounded-sm flex items-center justify-center">
                    Browse market
                </Link>
            </div>
        </div>
    )
}
