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
        <div className="fixed w-[95%] left-[2.5%] flex">
            <div className="mt-20 h-210 w-43 bg-secondary absolute flex flex-col">
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
    )
}

