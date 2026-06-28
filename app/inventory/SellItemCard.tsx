"use client";

import Image from "next/image";

//

export default function SellItemCard({ market_name, quantity, icon, hexColor, priceStr, setPriceStr, marketPrice, bidPrice, remove }: {
    market_name: string, quantity: number, icon: string, hexColor: string,
    priceStr: string, setPriceStr: (val: string) => void, marketPrice: number, bidPrice: number | null, remove: () => void
}) {
    const basePrice = parseFloat(marketPrice.toFixed(2))
    const price = parseFloat(priceStr)
    const modifier = basePrice > 0 && !isNaN(price) ? Math.round((price / basePrice - 1) * 100) : 0
    const sliderValue = Math.max(-20, Math.min(20, modifier))

    return (
        <div className="bg-accent rounded-sm mx-2 mt-2 p-2 flex flex-col gap-2" style={{ borderLeft: `3px solid #${hexColor}` }}>
            <div className="flex items-center gap-3">
                <div style={{ filter: `drop-shadow(0 0 6px #${hexColor}66)` }} className="shrink-0">
                    <Image src={icon} alt={market_name} width={52} height={52} style={{ width: 'auto', height: '52px' }} />
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: `#${hexColor}` }}>{market_name}</p>
                    <p className="text-xs opacity-40">Market ${marketPrice.toFixed(2)} · x{quantity}</p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0 -mt-1">
                    <button onClick={remove} className="text-xs opacity-30 hover:opacity-80 transition-opacity cursor-pointer leading-none -mt-1">✕</button>
                    <div className="flex items-center gap-1">
                        <span className="text-xs opacity-50">$</span>
                        <input
                            type="number"
                            min={0.01}
                            step={0.01}
                            value={priceStr}
                            placeholder="0.00"
                            onChange={e => {
                                const val = e.target.value;
                                if (val === "" || parseFloat(val) >= 0) setPriceStr(val);
                            }}
                            className="bg-primary rounded-sm w-16 h-7 text-center outline-none border border-gray-600 text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <p className="text-xs opacity-40">Price modifier</p>
                    <p className={`text-xs ${modifier > 0 ? 'text-green-400' : modifier < 0 ? 'text-red-400' : 'opacity-40'}`}>
                        {modifier > 0 ? `+${modifier}%` : modifier < 0 ? `-${Math.abs(modifier)}%` : '0%'}
                    </p>
                </div>
                <input
                    type="range"
                    min={-20}
                    max={20}
                    step={1}
                    value={sliderValue}
                    onChange={e => setPriceStr((basePrice * (1 + Number(e.target.value) / 100)).toFixed(2))}
                    className="w-full accent-special cursor-pointer"
                />
                <div className="flex justify-between text-xs opacity-30">
                    <span>-20%</span>
                    <span>+20%</span>
                </div>
                {bidPrice !== null && (
                    <button
                        onClick={() => setPriceStr(bidPrice.toFixed(2))}
                        className={`h-6 rounded-sm text-xs cursor-pointer transition-colors ${priceStr === bidPrice.toFixed(2) ? 'bg-special' : 'bg-primary opacity-60 hover:opacity-100'}`}
                    >
                        Instant
                    </button>
                )}
            </div>
        </div>
    )
}
