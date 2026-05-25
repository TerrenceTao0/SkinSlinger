import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Sign Up',
    description: 'Create a free SkinSlinger account and start buying or selling Steam skins today.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
