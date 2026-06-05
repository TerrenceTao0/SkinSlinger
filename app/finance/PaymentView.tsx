import { QRCodeSVG } from 'qrcode.react'
import type { Payment, PaymentStatus } from './types'
import { STATUS_LABELS } from './types'

export default function PaymentView({
    payment,
    paymentStatus,
    secondsLeft,
    copied,
    onCopy,
    onRetry,
}: {
    payment: Payment
    paymentStatus: PaymentStatus
    secondsLeft: number
    copied: "address" | "amount" | null
    onCopy: (text: string, type: "address" | "amount") => void
    onRetry: () => void
}) {
    const isTerminal = paymentStatus === "failed" || paymentStatus === "expired"

    return (
        <div className="h-full w-full flex justify-center items-center">
            <div className="w-100 bg-secondary p-6 frame-shadow rounded-[5px] flex flex-col gap-4">
                <p className="text-center text-lg font-medium">Send USDC (Polygon)</p>

                <div className="flex justify-center">
                    <QRCodeSVG value={payment.payAddress} size={160} bgColor="transparent" fgColor="white" />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between bg-primary rounded-sm px-3 py-2 gap-2">
                        <span className="text-xs text-gray-400 truncate">{payment.payAddress}</span>
                        <button onClick={() => onCopy(payment.payAddress, "address")} className="text-xs text-special shrink-0 cursor-pointer">
                            {copied === "address" ? "Copied!" : "Copy"}
                        </button>
                    </div>

                    <div className="flex items-center justify-between bg-primary rounded-sm px-3 py-2">
                        <span className="text-sm">{payment.payAmount} USDC</span>
                        <button onClick={() => onCopy(String(payment.payAmount), "amount")} className="text-xs text-special shrink-0 cursor-pointer">
                            {copied === "amount" ? "Copied!" : "Copy"}
                        </button>
                    </div>
                </div>

                <p className={`text-center text-sm ${isTerminal ? "text-red-400" : "text-gray-400"}`}>
                    {STATUS_LABELS[paymentStatus]}
                </p>

                {!isTerminal && (
                    <>
                        <p className={`text-center text-sm font-mono ${secondsLeft < 60 ? "text-red-400" : "text-gray-500"}`}>
                            Expires in {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}
                        </p>
                        <p className="text-xs text-gray-600 text-center">
                            20 minutes is more than enough time for transactions to confirm on Polygon. If you send the payment after the timer expires and it does not verify in time, you will not be refunded.
                        </p>
                    </>
                )}

                {isTerminal && (
                    <button onClick={onRetry} className="bg-accent w-full h-10 rounded-[5px] button text-sm">
                        Try again
                    </button>
                )}
            </div>
        </div>
    )
}
