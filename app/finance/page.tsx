import { Suspense } from 'react'
import FinanceClient from "./FinanceClient"
import type { Metadata } from 'next'

//

export const metadata: Metadata = {
    title: 'Finance',
    robots: { index: false, follow: false },
}

export default function Finance() {
    return <Suspense><FinanceClient /></Suspense>
}

