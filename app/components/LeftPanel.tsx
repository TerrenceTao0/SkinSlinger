"use client"

type GameFilter = "all" | "CS2" | "Dota2" | "Rust"

//

export default function LeftPanel({ gameFilter, setGameFilter }: {
    gameFilter: GameFilter,
    setGameFilter: (filter: GameFilter) => void
}) {
    const options: { label: string, value: GameFilter }[] = [
        { label: "All", value: "all" },
        { label: "CS2", value: "CS2" },
        { label: "Dota 2", value: "Dota2" },
        { label: "Rust", value: "Rust" },
    ]

    return (
        <>
            {/* Desktop: vertical sidebar */}
            <div className="hidden md:flex fixed w-[95%] left-[2.5%]">
                <div className="mt-20 h-210 w-43 bg-secondary absolute flex flex-col rounded-sm">
                    {options.map(({ label, value }) => (
                        <button
                            key={value}
                            onClick={() => setGameFilter(value)}
                            className={`w-full h-10 text-sm button ${gameFilter === value ? "bg-special" : ""}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile: horizontal filter row below nav */}
            <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-secondary flex px-3 py-1.5 gap-2 overflow-x-auto">
                {options.map(({ label, value }) => (
                    <button
                        key={value}
                        onClick={() => setGameFilter(value)}
                        className={`shrink-0 px-4 h-8 text-sm rounded-sm button ${gameFilter === value ? "bg-special" : "bg-accent"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </>
    )
}
