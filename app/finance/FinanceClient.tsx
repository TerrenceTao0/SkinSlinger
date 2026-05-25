"use client"

import { useState, useRef, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Image from 'next/image'

//

const WITHDRAWAL_FEE = 0.02

type Payment = {
    paymentId: string
    payAddress: string
    payAmount: number
    payCurrency: string
}

type PaymentStatus = "waiting" | "confirming" | "confirmed" | "finished" | "failed" | "expired" | "partially_paid"

const STATUS_LABELS: Record<PaymentStatus, string> = {
    waiting:        "Waiting for payment...",
    confirming:     "Transaction detected — confirming...",
    confirmed:      "Confirmed",
    finished:       "Complete",
    failed:         "Payment failed",
    expired:        "Payment expired",
    partially_paid: "Partially paid — please send the full amount",
}

//

export default function FinanceClient() {
    const [view, setView] = useState<"menu" | "deposit-amount" | "payment" | "deposit-success" | "withdraw" | "withdraw-success">("menu")
    const [amountInput, setAmountInput] = useState("")
    const [address, setAddress] = useState("")
    const [payment, setPayment] = useState<Payment | null>(null)
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("waiting")
    const [withdrawResult, setWithdrawResult] = useState<{ cryptoAmount: number } | null>(null)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState<"address" | "amount" | null>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [])

    function startPolling(paymentId: string) {
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/deposit-status/${paymentId}`)
                if (!res.ok) return
                const { status } = await res.json() as { status: PaymentStatus }
                setPaymentStatus(status)
                if (status === "finished") {
                    clearInterval(pollRef.current!)
                    setView("deposit-success")
                } else if (status === "failed" || status === "expired") {
                    clearInterval(pollRef.current!)
                }
            } catch {}
        }, 10000)
    }

    async function handleDeposit(e: React.FormEvent) {
        e.preventDefault()

        const amount = parseFloat(amountInput)

        if (!amount || amount < 1) {
            setError("Minimum deposit is $1.00")
            return
        }

        setLoading(true)
        setError("")

        const res = await fetch('/api/create-deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount }),
        })

        const data = await res.json()

        if (!res.ok) {
            setError(data.error ?? "Failed to create payment")
            setLoading(false)
            return
        }

        setPayment(data)
        setPaymentStatus("waiting")
        setView("payment")
        setLoading(false)
        startPolling(data.paymentId)
    }

    async function handleWithdraw(e: React.FormEvent) {
        e.preventDefault()

        const amount = parseFloat(amountInput)

        if (!amount || amount < 5) {
            setError("Minimum withdrawal is $5.00")
            return
        }

        if (!address.trim()) {
            setError("Wallet address required")
            return
        }

        setLoading(true)
        setError("")

        const res = await fetch('/api/withdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, address }),
        })

        const data = await res.json()

        if (!res.ok) {
            setError(data.error ?? "Withdrawal failed")
            setLoading(false)
            return
        }

        setWithdrawResult(data)
        setView("withdraw-success")
        setLoading(false)
    }

    function copy(text: string, type: "address" | "amount") {
        navigator.clipboard.writeText(text)
        setCopied(type)
        setTimeout(() => setCopied(null), 2000)
    }

    function reset() {
        setAmountInput("")
        setAddress("")
        setError("")
        setView("menu")
    }


    if (view === "deposit-success") {
        return (
            <div className="h-full w-full flex justify-center items-center">
                <div className="w-100 h-60 flex flex-col justify-center items-center bg-secondary gap-4 frame-shadow rounded-[5px]">
                    <p className="text-lg font-medium">Payment received!</p>
                    <p className="text-sm text-gray-400">Your balance will update shortly.</p>
                    <button className="bg-special w-40 h-10 rounded-[5px] button" onClick={reset}>Done</button>
                </div>
            </div>
        )
    }


    if (view === "withdraw-success" && withdrawResult) {
        return (
            <div className="h-full w-full flex justify-center items-center">
                <div className="w-100 flex flex-col justify-center items-center bg-secondary gap-4 frame-shadow rounded-[5px] p-8">
                    <p className="text-lg font-medium">Withdrawal initiated!</p>
                    <p className="text-sm text-gray-400 text-center">
                        {withdrawResult.cryptoAmount} USDC is on its way to your wallet.
                    </p>
                    <button className="bg-special w-40 h-10 rounded-[5px] button" onClick={reset}>Done</button>
                </div>
            </div>
        )
    }


    if (view === "payment" && payment) {
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
                            <button onClick={() => copy(payment.payAddress, "address")} className="text-xs text-special shrink-0 cursor-pointer">
                                {copied === "address" ? "Copied!" : "Copy"}
                            </button>
                        </div>
                        <div className="flex items-center justify-between bg-primary rounded-sm px-3 py-2">
                            <span className="text-sm">{payment.payAmount} USDC</span>
                            <button onClick={() => copy(String(payment.payAmount), "amount")} className="text-xs text-special shrink-0 cursor-pointer">
                                {copied === "amount" ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>

                    <p className={`text-center text-sm ${isTerminal ? "text-red-400" : "text-gray-400"}`}>
                        {STATUS_LABELS[paymentStatus]}
                    </p>

                    {isTerminal && (
                        <button onClick={() => { setView("deposit-amount"); setPayment(null) }} className="bg-accent w-full h-10 rounded-[5px] button text-sm">
                            Try again
                        </button>
                    )}
                </div>
            </div>
        )
    }


    if (view === "deposit-amount") {
        return (
            <div className="h-full w-full flex justify-center items-center">
                <div className="w-100 bg-secondary p-6 frame-shadow rounded-[5px]">
                    <form onSubmit={handleDeposit} className="flex flex-col gap-4">
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
                                onChange={e => setAmountInput(e.target.value)}
                                className="w-full pl-7 pr-3 py-2 bg-primary border border-gray-600 rounded-[5px]"
                                required
                                autoFocus
                            />
                        </div>

                        <p className="text-xs text-yellow-500 text-center">Only send USDC on the Polygon network. Sending on any other network will result in permanent loss of funds.</p>

                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        <button type="submit" disabled={loading} className="bg-special w-full h-10 rounded-[5px] button">
                            {loading ? "Loading..." : "Continue"}
                        </button>
                    </form>
                </div>
            </div>
        )
    }


    if (view === "withdraw") {
        const amount = parseFloat(amountInput) || 0
        const fee = amount * WITHDRAWAL_FEE
        const net = amount - fee

        return (
            <div className="h-full w-full flex justify-center items-center">
                <div className="w-100 bg-secondary p-6 frame-shadow rounded-[5px]">
                    <form onSubmit={handleWithdraw} className="flex flex-col gap-4">
                        <div className="flex items-center justify-center gap-2">
                            <Image src="/usdc.png" alt="USDC" width={24} height={24} />
                            <p className="text-sm text-gray-400">Withdraw to USDC (Polygon Network)</p>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                                type="number"
                                min="5"
                                step="0.01"
                                placeholder="0.00"
                                value={amountInput}
                                onChange={e => setAmountInput(e.target.value)}
                                className="w-full pl-7 pr-3 py-2 bg-primary border border-gray-600 rounded-[5px]"
                                required
                                autoFocus
                            />
                        </div>

                        <input
                            type="text"
                            placeholder="Your USDC (Polygon) wallet address"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            className="w-full px-3 py-2 bg-primary border border-gray-600 rounded-[5px] text-sm"
                            required
                        />

                        {amount >= 5 && (
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

                        <p className="text-xs text-yellow-500 text-center">Make sure your wallet address is on the Polygon network. Withdrawals sent to the wrong network cannot be recovered.</p>

                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        <button type="submit" disabled={loading} className="bg-special w-full h-10 rounded-[5px] button">
                            {loading ? "Processing..." : "Withdraw"}
                        </button>
                    </form>
                </div>
            </div>
        )
    }


    return (
        <div className="h-full w-full flex justify-center items-center">
            <div className="w-100 h-30 flex justify-center items-center bg-secondary gap-5 frame-shadow rounded-sm">
                <button className="bg-special w-40 h-15 rounded-[5px] button" onClick={() => { setAmountInput(""); setError(""); setView("deposit-amount") }}>
                    DEPOSIT
                </button>
                <button className="bg-special w-40 h-15 rounded-[5px] button" onClick={() => { setAmountInput(""); setError(""); setView("withdraw") }}>
                    WITHDRAW
                </button>
            </div>
        </div>
    )
}
