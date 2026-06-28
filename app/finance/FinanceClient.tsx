"use client"

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import type { Payment, PaymentStatus } from './types'
import MenuView from './MenuView'
import DepositAmountView from './DepositAmountView'
import PaymentView from './PaymentView'
import DepositSuccessView from './DepositSuccessView'
import WithdrawView from './WithdrawView'
import WithdrawSuccessView from './WithdrawSuccessView'

//

export default function FinanceClient({ pendingBalance }: { pendingBalance: number }) {
    const { data: session } = useSession()
    const [view, setView] = useState<"menu" | "deposit-amount" | "payment" | "deposit-success" | "withdraw" | "withdraw-success">("menu")
    const [amountInput, setAmountInput] = useState("")
    const [address, setAddress] = useState("")
    const [payment, setPayment] = useState<Payment | null>(null)
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("waiting")
    const [withdrawResult, setWithdrawResult] = useState<{ usdcAmount: number } | null>(null)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState<"address" | "amount" | null>(null)
    const [secondsLeft, setSecondsLeft] = useState(0)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
                
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    // The deposit id returned by /api/create-deposit is the pay address itself.
    function startPolling(depositId: string) {
        if (pollRef.current) clearInterval(pollRef.current)

        pollRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/deposit-status/${depositId}`)

                if (!res.ok) return

                const { status } = await res.json() as { status: PaymentStatus }

                setPaymentStatus(status)

                if (status === "finished") {
                    clearInterval(pollRef.current!)
                    setView("deposit-success")

                } 
                else if (status === "failed" || status === "expired") {
                    clearInterval(pollRef.current!)
                }
            } catch {}
        }, 10000)
    }


    function startTimer(depositId: string) {
        if (timerRef.current) clearInterval(timerRef.current)

        timerRef.current = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!)
                    fetch(`/api/deposit-status/${depositId}`)
                        .then(r => r.json())
                        .then(({ status }) => { if (status === 'finished') setView('deposit-success') })
                        .catch(() => {})

                    return 0
                }


                return prev - 1
            })
        }, 1000)
    }


    async function handleDeposit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        const amount = parseFloat(amountInput)

        if (!amount || amount < 1) { setError("Minimum deposit is $1.00"); return }

        setLoading(true)
        setError("")

        const res = await fetch('/api/create-deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount }),
        })


        const data = await res.json()

        if (!res.ok) { setError(data.error ?? "Failed to create payment"); setLoading(false); return }

        setPayment(data)
        setPaymentStatus("waiting")
        setSecondsLeft(20 * 60)
        setView("payment")
        setLoading(false)
        startPolling(data.depositId)
        startTimer(data.depositId)
    }


    async function handleWithdraw(e: React.FormEvent) {
        e.preventDefault()

        const amount = parseFloat(amountInput)

        if (!amount || amount < 1) { setError("Minimum withdrawal is $1.00"); return }

        if (!address.trim()) { setError("Wallet address required"); return }

        setLoading(true)
        setError("")

        const res = await fetch('/api/withdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, address }),
        })


        const data = await res.json()

        if (!res.ok) { setError(data.error ?? "Withdrawal failed"); setLoading(false); return }

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


    if (view === "deposit-success") return <DepositSuccessView onDone={reset} />

    if (view === "withdraw-success" && withdrawResult) return <WithdrawSuccessView usdcAmount={withdrawResult.usdcAmount} onDone={reset} />

    if (view === "payment" && payment) return (
        <PaymentView
            payment={payment}
            paymentStatus={paymentStatus}
            secondsLeft={secondsLeft}
            copied={copied}
            onCopy={copy}
            onRetry={() => { setView("deposit-amount"); setPayment(null) }}
        />
    )


    if (view === "deposit-amount") return (
        <DepositAmountView
            amountInput={amountInput}
            onAmountChange={setAmountInput}
            error={error}
            loading={loading}
            onSubmit={handleDeposit}
        />
    )


    if (view === "withdraw") return (
        <WithdrawView
            amountInput={amountInput}
            onAmountChange={setAmountInput}
            address={address}
            onAddressChange={setAddress}
            error={error}
            loading={loading}
            onSubmit={handleWithdraw}
        />
    )


    return (
        <MenuView
            balance={session?.user?.cash ?? 0}
            pending={pendingBalance}
            onDeposit={() => { setAmountInput(""); setError(""); setView("deposit-amount") }}
            onWithdraw={() => { setAmountInput(""); setError(""); setView("withdraw") }}
        />
    )
}

