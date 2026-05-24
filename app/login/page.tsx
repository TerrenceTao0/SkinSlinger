"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from 'next/link'

//

export default function Login() {
    const router = useRouter();

    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState("");
    const [user, setUser] = useState("");
    const [password, setPassword] = useState("");
    const [step, setStep] = useState<"credentials" | "2fa">("credentials");
    const [code, setCode] = useState("");

    const formFilled = user.length > 0 && password.length > 0;

    async function onSubmit(event: React.SubmitEvent<HTMLElement>) {
        event.preventDefault();
        setWaiting(true);
        setError("");

        try {
            if (step === "credentials") {
                const result = await signIn('credentials', {
                    user,
                    password,
                    redirect: false,
                });


                if (result?.error === "2FA_REQUIRED") {
                    setStep("2fa");

                } else if (result?.error) {
                    setError("Account details incorrect");

                } else {
                    router.push("/");
                }
            }
             else {
                const result = await signIn('credentials', {
                    user,
                    password,
                    code,
                    redirect: false,
                });

                
                if (result?.error === "2FA_EXPIRED") {
                    setError("Code expired. Please log in again.");
                    setStep("credentials");
                    setCode("");

                } 
                else if (result?.error === "2FA_INVALID") {
                    setError("Incorrect code.");
                } 
                else if (result?.error) {
                    setError("Something went wrong.");
                } 
                else {
                    router.push("/");
                }
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
                className="flex flex-col gap-1 bg-secondary rounded-[5px] text-center w-96 pb-8 frame-shadow"
            >
                <h1 className="text-4xl mt-4 text-special font-medium">
                    Login
                </h1>

                {step === "credentials" ? (
                    <>
                        <div className="input-box relative">
                            <input
                                id="username"
                                className="sign-up-input peer"
                                value={user}
                                placeholder=""
                                onChange={(event) => setUser(event.target.value)}
                                required
                            />

                            <br />

                            <label htmlFor="username" className="floating-label">
                                Username/Email
                            </label>
                        </div>

                        <div className="input-box relative">
                            <input
                                id="password"
                                className="sign-up-input peer"
                                type="password"
                                value={password}
                                placeholder=""
                                onChange={(event) => setPassword(event.target.value)}
                                required
                            />

                            <label htmlFor="password" className="floating-label">
                                Password
                            </label>
                        </div>

                        <Link href="/forgot-password" className="rounded-md cursor-pointer bg-transparent ml-19 w-20 h-6 flex items-center text-[10px]">
                            Forgot Password
                        </Link>

                        {error && (
                            <p className="text-red-500 text-sm mt-3">{error}</p>
                        )}

                        <div className="mt-6 flex flex-col gap-2">
                            <button
                                disabled={waiting}
                                type="submit"
                                className={`rounded-md button bg-accent self-center ${error === "" && formFilled ? 'w-60 h-9' : 'w-50 h-9'}`}
                            >
                                {waiting ? "Processing..." : "Continue"}
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
                    </>
                ) : (
                    <>
                        <p className="text-sm text-gray-400 mt-6">
                            A 6-digit code has been sent to your email.
                        </p>

                        <div className="input-box relative">
                            <input
                                id="code"
                                className="sign-up-input peer"
                                value={code}
                                placeholder=""
                                maxLength={6}
                                onChange={(event) => setCode(event.target.value)}
                                required
                            />

                            <label htmlFor="code" className="floating-label">
                                Code
                            </label>
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm mt-4">{error}</p>
                        )}

                        <div className="mt-6 flex justify-center">
                            <button
                                disabled={waiting}
                                type="submit"
                                className={`rounded-md button bg-accent ${error === "" && code.length === 6 ? 'w-60 h-9' : 'w-50 h-9'}`}
                            >
                                {waiting ? "Processing..." : "Verify"}
                            </button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
}
