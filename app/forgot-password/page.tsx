"use client";

import { useState } from "react";

//

export default function ForgotPassword() {
    const [error, setError] = useState("");
    const [waiting, setWaiting] = useState(false);

    async function onSubmit(event: React.ChangeEvent<HTMLElement>) {
        if (error != "") {
            return;
        }


        setWaiting(true);

        try {

        }
        catch {

        }
        finally {
            setWaiting(false);
        }
    }


    async function checkEmail(event: React.ChangeEvent<HTMLElement>) {
        if (!event.target.value.contains("@")) {
            setError("Invalid email")
        }
        else {
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

                    <div className="mt-5 flex flex-col gap-2">
                        <button 
                            disabled={waiting}
                            type="submit" 
                            className="rounded-md button bg-accent self-center w-60 h-9"
                        >
                            {waiting? "Processing..." : "Request Reset"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
