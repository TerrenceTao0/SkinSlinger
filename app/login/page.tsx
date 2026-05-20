"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import GoogleProvider from "next-auth/providers/google"

//

export default function Login() {
    const router = useRouter();

    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState("");
    const [user, setUser] = useState("");
    const [password, setPassword] = useState("");

    const formFilled = user.length > 0 && password.length > 0

    async function onSubmit(event: React.SubmitEvent<HTMLElement>) {
        event.preventDefault();
        setWaiting(true);

        try {
            const signInData = await signIn('credentials', {
                user: user,
                password: password,
                redirect: false,
            });

            if (signInData?.error) {
                setError("Account details incorrect");
                
            } else {
                router.push("/");
            }
        }
        catch {
            setError("Network error");
        }
        finally {
            setWaiting(false);
        }
    }

    return (
        <div className="flex flex-col justify-center min-h-screen items-center m-0">
            <form 
                onSubmit={onSubmit} 
                className="flex flex-col gap-1 bg-secondary rounded-[5px] text-center w-96 h-105"
            >
                <h1 className="text-4xl mt-4 text-special">
                    Login
                </h1>

                <div className="input-box relative">
                    <input
                        id="username"
                        className="sign-up-input peer"
                        placeholder=""
                        onChange={(event) => setUser(event.target.value)}
                        required
                    />

                    <br></br>

                    <label 
                        htmlFor="username"
                        className="floating-label"
                    >
                        Username/Email
                    </label>
                </div>

                <div className="input-box relative">
                    <input
                        id="password"
                        className="sign-up-input peer"
                        type="password"
                        placeholder=""
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />

                    <label
                        htmlFor="password"
                        className="floating-label"
                    >
                        Password
                    </label>
                </div>

                <button className="mt-0.5 rounded-md cursor-pointer bg-transparent ml-8 w-40 h-7 text-[10px]">
                    Forgot Password
                </button>

                <div className="relative self-center justify-center top-10">
                    {error === "Account details incorrect" && (
                        <p className="request-error">
                            Account details are incorrect.
                        </p>
                    )}
                </div>

                <div className="mt-10 flex flex-col gap-2">
                    <button 
                        disabled={waiting}
                        type="submit" 
                        className={`rounded-md button bg-accent self-center ${error === "" && formFilled ? 'w-60 h-9' : 'w-50 h-9'}`}
                    >
                        {waiting? "Processing..." : "Continue"}
                    </button>

                    <div className="flex items-center gap-2 mx-8">
                        <hr className="flex-1 border-gray-500" />
                        <span className="text-gray-500 text-sm">Or</span>
                        <hr className="flex-1 border-gray-500" />
                    </div>

                    <button 
                        type="button" 
                        className={`rounded-md button bg-accent self-center ${error === "" && formFilled ? 'w-50 h-8 text-[12px]' : 'w-80 h-8'}`}
                        onClick={() => signIn('google', { callbackUrl: '/' })}
                    >
                        Login with Google
                    </button>
                </div>
            </form>
        </div>
    );
}

