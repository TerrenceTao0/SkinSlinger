"use client";

import { useState } from 'react'

//

export default function SignUp() {
    const [error, setError] = useState("");

    function checkUser(event: React.ChangeEvent<HTMLInputElement>) {
        const username = event.target.value;

        if (username.length < 3 && username.length > 0) {
            setError("username too short");

            return false;
        }
        else if (error == "username too short") {
            setError("");
        }


        return true;
    }


    function checkPassword(event: React.ChangeEvent<HTMLInputElement>) {
        const password = event.target.value;

        if (password.length < 5 && password.length > 0) {
            setError("password too short")

            return false;
        }
        else if (error == "password too short") {
            setError("");
        }


        return true;
    }


    return (
        <div className="flex flex-col justify-center min-h-screen items-center m-0">
            <form className="flex flex-col gap-1 bg-secondary rounded-[5px] text-center w-96 h-96">
                <h1 className="text-4xl mt-4 text-special">
                    Sign Up
                </h1>

                <div className="input-box relative">
                    <input
                        id="username"
                        className="sign-up-input peer"
                        placeholder=""
                        required
                        onChange={checkUser}
                    />

                    <br></br>

                    <label 
                        htmlFor="username"
                        className="floating-label"
                    >
                        Username
                    </label>

                    {error == "username too short" && (
                        <p className="error">
                            Your username must be at least 3 characters long.
                        </p>
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

                    <label
                        htmlFor="password"
                        className="floating-label"
                    >
                        Password
                    </label>

                    {error == "password too short" && (
                        <p className="error">
                            Password must be at least 5 characters long.
                        </p>
                    )}
                </div>

                <div className="input-box relative">
                    <input
                        id="email"
                        className="sign-up-input peer"
                        type="email"
                        placeholder=""
                        required
                    />

                    <label
                        htmlFor="email"
                        className="floating-label"
                    >
                        Email
                    </label>
                </div>

                <button className="mt-5 rounded-md button bg-accent self-center w-50 h-10">
                    Create
                </button>
            </form>
        </div>
    );
}


