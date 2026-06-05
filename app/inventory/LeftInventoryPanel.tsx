"use client"

type GameFilter = "CS2" | "Dota2" | "Rust" | "TF2"

export default function LeftInventoryPanel({
    gameFilter,
    setGameFilter,
}: {
    gameFilter: GameFilter
    setGameFilter: (g: GameFilter) => void
}) {
    return (
        <div className="hidden md:flex flex-col fixed left-[2.5%] top-20 w-43">
            <div className="bg-secondary rounded-sm px-3 py-3">
                <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-1.5">Games</p>
                <div className="flex flex-col gap-0.5">
                    {(["CS2", "Dota2", "Rust", "TF2"] as const).map(g => (
                        <button
                            key={g}
                            onClick={() => setGameFilter(g)}
                            className={`h-9 px-2.5 rounded-sm text-sm text-left button transition-colors ${gameFilter === g ? "bg-special font-medium" : "hover:bg-accent"}`}
                        >
                            {g === "Dota2" ? "Dota 2" : g}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
