import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Login',
    description: 'Log in to your SkinSlinger account to buy and sell Steam skins.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
