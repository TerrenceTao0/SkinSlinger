"use client"

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Suspense } from 'react'

//

function VerifySuccessContent() {
    const searchParams = useSearchParams()

    useEffect(() => {
        const token = searchParams.get('token')
        const email = searchParams.get('email')
        if (token && email) {
            signIn('credentials', { user: email, password: '', autoLoginToken: token, callbackUrl: '/' })
        }
    }, [])

    return (
        <div className="flex h-full w-full justify-center items-center">
            <p className="text-lg opacity-60">Logging you in...</p>
        </div>
    )
}

export default function VerifySuccess() {
    return <Suspense><VerifySuccessContent /></Suspense>
}
