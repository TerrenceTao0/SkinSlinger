"use client";

import { useState } from 'react';
import { containsSpecialChars } from '@/lib/utils';

//

export default function SignUp() {
    const [error, setError] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [waiting, setWaiting] = useState(false);
    const [verifying, setVerifying] = useState(false);

    const formFilled = username.length > 0 && password.length > 0 && email.length > 0 && email.includes("@");

    function checkUser(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setUsername(value);

        if (value.length < 3 && value.length > 0) {
            setError("Username too short");
        } 
        else if (containsSpecialChars(value)) {
            setError("Username contains special characters")
        }
        else if (error == "Username too short" || error == "Username contains special characters") {
            setError("");
        }
    }

    function checkPassword(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setPassword(value);

        if (value.length < 5 && value.length > 0) {
            setError("Password too short");

        }
        else if (error == "Password too short") {
            setError("");
        }
    }

    function checkEmail(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setEmail(value);

        if (!value.includes("@")) {
            setError("Invalid email");
        }
    }

    async function onSubmit(event: React.SubmitEvent<HTMLElement>) {
        event.preventDefault();

        if (username.length < 3) {
            setError("Username too short");

            return;
        }
        else if (containsSpecialChars(username)) {
            setError("Username contains special characters")

            return;
        }
        else if (password.length < 5) {
            setError("Password too short");

            return;
        }


        setWaiting(true);

        try {
            const response = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, email }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Server error. Try again.");
            } 
            else {
                setVerifying(true);
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
           {!verifying ? (
            <form
                onSubmit={onSubmit}
                className="flex flex-col gap-1 bg-secondary rounded-[5px] text-center w-96 h-96"
                >
                    <h1 className="text-4xl mt-4 text-special">Sign Up</h1>

                    <div className="input-box relative">
                        <input
                            id="username"
                            className="sign-up-input peer"
                            placeholder=""
                            required
                            onChange={checkUser}
                        />

                        <br />
                        
                        <label htmlFor="username" className="floating-label">Username</label>

                        {error === "Username too short" && (
                            <p className="error">Username must be at least 3 characters long.</p>
                        )}

                        {error === "Username contains special characters" && (
                            <p className="error">Username cannot contain special characters.</p>
                        )}
                    </div>

                    <div className="input-box relative">
                        <input
                            id="password"
                            className="sign-up-input peer"
                            type="password"
                            placeholder=""
                            required
                            onChange={checkPassword}
                        />

                        <label htmlFor="password" className="floating-label">Password</label>

                        {error === "Password too short" && (
                            <p className="error">Password must be at least 5 characters long.</p>
                        )}
                    </div>

                    <div className="input-box relative">
                        <input
                            id="email"
                            className="sign-up-input peer"
                            type="email"
                            placeholder=""
                            required
                            onChange={checkEmail}
                        />
                        
                        <label htmlFor="email" className="floating-label">Email</label>
                    </div>

                    <div className="relative self-center justify-center top-11">
                        {(error === "Email is already in use" || error == "Username is already in use" || error == "Server error. Try again.") && (
                            <p className="request-error ">
                                {error}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={waiting}
                        className={`mt-11 rounded-md button bg-accent self-center ${error==="" && formFilled ? 'w-60 h-9' : 'w-50 h-9'}`}
                    >
                        {waiting ? "Creating..." : "Create"}
                    </button>
                </form>
            ) : (
                <div className="flex flex-col gap-1 bg-secondary rounded-[5px] text-center w-96 h-26 justify-center">
                    <p>
                        Check your email for a verification link.
                    </p>
                </div>
            )}
        </div>
    );
}

