export const WITHDRAWAL_FEE = 0.02

export type Payment = {
    paymentId: string
    payAddress: string
    payAmount: number
    payCurrency: string
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
