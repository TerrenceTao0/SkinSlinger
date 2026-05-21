"use client"

import Link from 'next/link'
import { useSearchParams } from 'next/navigation';

//

export default function Status(request: Request) {
    const searchParams = useSearchParams();
    const message = searchParams.get("message");
    const redirect = searchParams.get("redirect");

    return (
        <div className="h-full w-full flex justify-center items-center">
            {message && (
                <div className="bg-secondary w-100 h-50 flex flex-col items-center">
                    <p className="mt-11 text-2xl">
                        {message}
                    </p>

                    <Link href={redirect ?? "/"}>
                        <button className="button bg-accent w-72 h-12 mt-13">
                            Okay
                        </button>
                    </Link>
                </div>
            )}
        </div>
    )
}

