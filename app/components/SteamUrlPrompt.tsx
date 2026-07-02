"use client";

import { useState } from "react";

//

const url_start = "https://steamcommunity.com/tradeoffer/new/?partner=";

//

export default function SteamUrlPrompt({ onLinked, onClose }: {
    onLinked: () => void,
    onClose?: () => void,
}) {
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    const [waiting, setWaiting] = useState(false);

    function checkUrl(event: React.ChangeEvent<HTMLInputElement>) {
        const val = event.target.value;
        setUrl(val);

        if (!val.includes(url_start) && val.length > 0) {
            setError("Invalid url");
        }
        else {
            setError("");
        }
    }

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (error != "") {
            return;
        }

        setWaiting(true);

        try {
            const response = await fetch("/api/trade-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error ?? "Failed to save trade URL");
            }
            else {
                onLinked();
            }
        }
        catch {
            setError("Network error.");
        }
        finally {
            setWaiting(false);
        }
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-5" onClick={onClose} />

            <div className="fixed inset-0 z-6 flex items-center justify-center">
                <form
                    className="flex flex-col bg-secondary rounded-sm frame-shadow p-6 gap-4 w-full max-w-md mx-4"
                    onSubmit={onSubmit}
                >
                    <div className="flex flex-col gap-1">
                        <p className="text-xl font-semibold">
                            Steam Trade URL required
                        </p>

                        <p className="text-sm text-gray-400">
                            We need your trade URL so buyers can send you items directly.
                        </p>
                    </div>

                    <div className="flex flex-col gap-1">
                        <input
                            id="url"
                            className="w-full h-10 bg-accent rounded-sm border border-gray-500 outline-none px-3 text-sm"
                            placeholder="https://steamcommunity.com/tradeoffer/new/?partner=..."
                            required
                            onChange={checkUrl}
                        />
                        {error === "Invalid url" && (
                            <p className="text-red-500 text-xs">
                                Invalid trade URL.
                            </p>
                        )}
                        {error && error !== "Invalid url" && (
                            <p className="text-red-500 text-xs">
                                {error}
                            </p>
                        )}
                    </div>

                    <a
                        href="https://steamcommunity.com/my/tradeoffers/privacy"
                        target="_blank"
                        className="text-special text-sm hover:underline"
                    >
                        Where do I find my trade URL? →
                    </a>

                    <button
                        disabled={waiting}
                        type="submit"
                        className="rounded-sm button bg-special h-10 text-sm font-medium"
                    >
                        {waiting ? "Saving..." : "Save Trade URL"}
                    </button>
                </form>
            </div>
        </>
    );
}
