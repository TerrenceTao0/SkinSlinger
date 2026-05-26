"use client";

import Image from "next/image";

const DISCOUNTS = [0, 10, 20, 30, 40];

export default function SellItemCard({ market_name, quantity, icon, hexColor, priceStr, setPriceStr, marketPrice, remove }: {
    market_name: string, quantity: number, icon: string, hexColor: string,
    priceStr: string, setPriceStr: (val: string) => void, marketPrice: number, remove: () => void
}) {
    const basePrice = parseFloat(marketPrice.toFixed(2))
    const price = parseFloat(priceStr)
    const activeDiscount = DISCOUNTS.find(d => priceStr === (basePrice * (1 - d / 100)).toFixed(2)) ?? null
    const calculatedDiscount = basePrice > 0 && !isNaN(price) ? Math.round((1 - price / basePrice) * 100) : 0
    const displayDiscount = activeDiscount !== null ? activeDiscount : calculatedDiscount

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
                    <p className="text-xs opacity-40">Discount modifiers</p>
                    <p className={`text-xs ${displayDiscount > 0 ? 'text-red-400' : displayDiscount < 0 ? 'text-green-400' : 'opacity-40'}`}>
                        {displayDiscount > 0 ? `-${displayDiscount}%` : displayDiscount < 0 ? `+${Math.abs(displayDiscount)}%` : '0%'}
                    </p>
                </div>
                <div className="flex gap-1">
                    {DISCOUNTS.map(d => (
                        <button
                            key={d}
                            onClick={() => setPriceStr((basePrice * (1 - d / 100)).toFixed(2))}
                            className={`flex-1 h-6 rounded-sm text-xs cursor-pointer transition-colors ${activeDiscount === d ? 'bg-special' : 'bg-primary opacity-60 hover:opacity-100'}`}
                        >
                            {d === 0 ? '0%' : `-${d}%`}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
