"use client";

import { useState } from "react";
import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";

//

export default function ResetPassword() {
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [waiting, setWaiting] = useState(false);

    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    async function onSubmit(event: React.ChangeEvent<HTMLElement>) {
        event.preventDefault();

        if (error != "") return;

        setWaiting(true);

        try {
            const response = await fetch('/api/reset-password', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password })
            }) 

            const data = await response.json();

            if (!response.ok) {
                const error = data.error;

                if (error) {
                    router.push(`/status?message=${error}&redirect=/forgot-password`);
                    
                } else {
                    router.push("/login");
                }
            }
            else {
                router.push(`/login`);
            }
        }
        catch {

        }
        finally {
            setWaiting(false);
        }
    }


    function checkPassword(event: React.ChangeEvent<HTMLElement>) {
        const password = event.target.value;
        setPassword(password);

        if (password.length > 0 && password.length < 5) {
            setError("Password must be at least 5 characters long.")
        }
        else if (error == "Password must be at least 5 characters long.") {
            setError("");
        }
    }


    return (
        <div className="flex flex-col justify-center min-h-screen items-center m-0">
            <form 
                onSubmit={onSubmit}
                className="flex flex-col gap-1 bg-secondary rounded-[5px] text-center w-96 h-50"
            >
                <h1 className="text-4xl mt-4 text-special">
                    New password
                </h1>

                <div className="input-box relative">
                    <input
                        id="password"
                        className="sign-up-input peer"
                        placeholder=""
                        onChange={checkPassword}
                        type="password"
                        required
                    />

                    <br></br>

                    <label 
                        htmlFor="password"
                        className="floating-label"
                    >
                        Password
                    </label>

                    {error.length > 0 && (
                        <p className="error">{error}</p>
                    )}

                    <div className="mt-5 flex flex-col gap-2">
                        <button 
                            disabled={waiting}
                            type="submit" 
                            className={`rounded-md button bg-accent self-center ${error === "" && password.length >= 5 && token ? 'w-60 h-9' : 'w-40 h-9'}`}
                        >
                            {waiting? "Processing..." : "Change"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

