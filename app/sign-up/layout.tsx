import type { Metadata } from 'next'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from "next/navigation";

//

export const metadata: Metadata = {
    title: 'Sign Up',
    description: 'Create a free SkinSlinger account and start buying or selling Steam skins today.',
}

export default async function Layout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);

    if (session) {
        redirect("/market");
    }


    return <>{children}</>
}

