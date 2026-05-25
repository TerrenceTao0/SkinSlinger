"use client"

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

//

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!)

//

function PaymentForm({ amountCents }: { amountCents: number }) {
    const stripe = useStripe()
    const elements = useElements()
    const [error, setError] = useState("")
    const [processing, setProcessing] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!stripe || !elements) return

        setProcessing(true)
        setError("")

        const { error: confirmError } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/finance`,
            },
        })

        // Only reached if confirmPayment fails without redirecting
        if (confirmError) {
            setError(confirmError.message ?? "Something went wrong")
            setProcessing(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
            <p className="text-center text-lg font-medium mb-1">
                Deposit ${(amountCents / 100).toFixed(2)}
            </p>
            <PaymentElement options={{ layout: 'tabs' }} />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            <button
                type="submit"
                disabled={!stripe || processing}
                className="bg-special w-full h-10 rounded-[5px] button mt-2"
            >
                {processing ? "Processing..." : `Pay $${(amountCents / 100).toFixed(2)}`}
            </button>
        </form>
    )
}

//

export default function FinanceClient() {
    const [view, setView] = useState<"menu" | "amount" | "payment" | "success">("menu")
    const [amountInput, setAmountInput] = useState("")
    const [amountCents, setAmountCents] = useState(0)
    const [clientSecret, setClientSecret] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)

        if (params.get('redirect_status') === 'succeeded') {
            setView("success")
            window.history.replaceState({}, '', '/finance')
        }
    }, [])

    
    async function handleAmountSubmit(e: React.FormEvent) {
        e.preventDefault()

        const cents = Math.round(parseFloat(amountInput) * 100)

        if (!cents || cents < 100) {
            setError("Minimum deposit is $1.00")
            return
        }


        setLoading(true)
        setError("")

        const res = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: cents }),
        })


        if (!res.ok) {
            setError("Failed to initialize payment")
            setLoading(false)

            return
        }


        const { clientSecret } = await res.json()
        setAmountCents(cents)
        setClientSecret(clientSecret)
        setView("payment")
        setLoading(false)
    }


    if (view === "success") {
        return (
            <div className="h-full w-full flex justify-center items-center">
                <div className="w-100 h-60 flex flex-col justify-center items-center bg-secondary gap-4 frame-shadow rounded-[5px]">
                    <p className="text-lg font-medium">
                        Payment successful!
                    </p>

                    <p className="text-sm text-gray-400">
                        Your balance will update shortly.
                    </p>

                    <button
                        className="bg-special w-40 h-10 rounded-[5px] button"
                        onClick={() => setView("menu")}
                    >
                        Done
                    </button>
                </div>
            </div>
        )
    }


    if (view === "amount") {
        return (
            <div className="h-full w-full flex justify-center items-center">
                <div className="w-100 bg-secondary p-6 frame-shadow rounded-[5px]">
                    <form 
                        onSubmit={handleAmountSubmit} 
                        className="flex flex-col gap-3"
                    >
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

                        {error && <p className="text-red-400 text-sm">
                            {error}
                        </p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-special w-full h-10 rounded-[5px] button"
                        >
                            {loading ? "Loading..." : "Continue"}
                        </button>
                    </form>
                </div>
            </div>
        )
    }


    if (view === "payment" && clientSecret) {
        return (
            <div className="h-full w-full flex justify-center items-center">
                <div className="w-100 bg-secondary p-6 frame-shadow rounded-[5px]">
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <PaymentForm amountCents={amountCents} />
                    </Elements>
                </div>
            </div>
        )
    }


    return (
        <div className="h-full w-full flex justify-center items-center">
            <div className="w-100 h-30 flex justify-center items-center bg-secondary gap-5 frame-shadow rounded-sm">
                <button
                    className="bg-special w-40 h-15 rounded-[5px] button"
                    onClick={() => setView("amount")}
                >
                    DEPOSIT
                </button>

                <button className="bg-special w-40 h-15 rounded-[5px] button">
                    WITHDRAW
                </button>
            </div>
        </div>
    )
}
