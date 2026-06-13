export const WITHDRAWAL_FEE = 0.02

// Shape returned by /api/create-deposit (the deposit id is the pay address)
export type Payment = {
    depositId: string
    payAddress: string
    payAmount: number
}

export type PaymentStatus = "waiting" | "confirming" | "confirmed" | "finished" | "failed" | "expired" | "partially_paid"

export const STATUS_LABELS: Record<PaymentStatus, string> = {
    waiting: "Waiting for payment...",
    confirming: "Transaction detected - confirming...",
    confirmed: "Confirmed",
    finished: "Complete",
    failed: "Payment failed",
    expired: "Payment expired",
    partially_paid: "Partially paid — please send the full amount",
}
