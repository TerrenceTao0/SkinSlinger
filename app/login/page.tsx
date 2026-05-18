"use client";

//

export default function Login() {
    return (
        <div className="flex flex-col justify-center min-h-screen items-center m-0">
            <form className="flex flex-col gap-1 bg-secondary rounded-[5px] text-center w-96 h-86">
                <h1 className="text-4xl mt-4 text-special">
                    Login
                </h1>

                <div className="input-box relative">
                    <input
                        id="username"
                        className="sign-up-input peer"
                        placeholder=""
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

                <button className="mt-7 rounded-md button bg-accent self-center w-50 h-10">
                    Continue
                </button>
            </form>
        </div>
    );
}

