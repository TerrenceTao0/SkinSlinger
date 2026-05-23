"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

//

export default function ForgotPassword() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [waiting, setWaiting] = useState(false);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (error != "") return;

        setWaiting(true);

        try {
            const response = await fetch('/api/forgot-password', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            }) 

            const data = await response.json();

            if (!response.ok) {
                if (data.error) setError(data.error);
            }
            else {
                router.push("/status?message=Check your email for a reset link.")
            }
        }
        catch (error) {
            setError(error as string);
        }
        finally {
            setWaiting(false);
        }
    }


    function checkEmail(event: React.ChangeEvent<HTMLInputElement>) {
        const email = event.target.value;
        setEmail(email);

        if (!email.includes("@") && email.length > 0) {
            setError("Email is not valid.")
        }
        else if (error == "Email is not valid.") {
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
                    Account email
                </h1>

                <div className="input-box relative">
                    <input
                        id="email"
                        className="sign-up-input peer"
                        placeholder=""
                        onChange={checkEmail}
                        required
                    />

                    <br></br>

                    <label 
                        htmlFor="email"
                        className="floating-label"
                    >
                        Email
                    </label>

                    {error.length > 0 && (
                        <p className="error">{error}</p>
                    )}

                    <div className="mt-5 flex flex-col gap-2">
                        <button 
                            disabled={waiting}
                            type="submit" 
                            className={`rounded-md button bg-accent self-center ${error === "" && email.length > 0 ? 'w-60 h-9' : 'w-40 h-9'}`}
                        >
                            {waiting? "Processing..." : "Request Reset"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

