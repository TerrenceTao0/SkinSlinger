const SEGMENTS = [
    { label: 'FN', from: 0,    to: 0.07, color: 'rgb(74, 125, 18)' },
    { label: 'MW', from: 0.07, to: 0.15, color: 'rgb(130, 180, 97)' },
    { label: 'FT', from: 0.15, to: 0.38, color: 'rgb(220, 178, 89)' },
    { label: 'WW', from: 0.38, to: 0.45, color: 'rgb(187, 100, 84)' },
    { label: 'BS', from: 0.45, to: 1.00, color: 'rgb(132, 69, 59)' },
] as const;

export default function FloatBar({ value, showLabels = true }: { value: number; showLabels?: boolean }) {
    const pct = Math.min(Math.max(value, 0), 1) * 100;

    return (
        <div className="w-full flex flex-col gap-1">
            {/* Bar + arrow */}
            <div className="relative pb-2">
                <div className="w-full rounded-sm overflow-hidden" style={{ height: '8px', position: 'relative' }}>
                    {SEGMENTS.map(seg => (
                        <div
                            key={seg.label}
                            style={{
                                position: 'absolute',
                                inset: `0 ${(1 - seg.to) * 100}% 0 ${seg.from * 100}%`,
                                backgroundColor: seg.color,
                            }}
                        />
                    ))}
                </div>
                <div
                    className="absolute"
                    style={{ bottom: '-4px', left: `calc(${pct}% - 7px)`, borderRadius: '2px' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" viewBox="0 0 14 10" fill="none">
                        <path d="M4.15918 8.40918C3.43712 9.19692 2.2289 9.19691 1.50684 8.40918C0.830728 7.67158 0.830851 6.51112 1.50684 5.77344L5.34082 1.59082C6.06289 0.803321 7.27018 0.803214 7.99219 1.59082L11.8262 5.77344C12.502 6.51107 12.5021 7.67162 11.8262 8.40918L11.8174 8.41895C11.1092 9.1717 9.90012 9.20981 9.16602 8.40918L6.66309 5.67871L4.15918 8.40918Z" fill="#F3F3F3" stroke="#262B34" strokeWidth="2"/>
                    </svg>
                </div>
            </div>
            {showLabels && (
                <div className="relative h-3.5">
                    {SEGMENTS.map(seg => (
                        <span
                            key={seg.label}
                            className="absolute text-[9px] text-gray-500 -translate-x-1/2"
                            style={{ left: `${(seg.from + seg.to) / 2 * 100}%` }}
                        >
                            {seg.label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
