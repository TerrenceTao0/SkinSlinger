import Image from 'next/image'
import { SteamItem } from '@/lib/steam'

//

export default function InventoryItemCard({ item, quantity, selling, setSelling, hexColor, loading = false }: {
    item: SteamItem,
    quantity: number,
    selling: SteamItem[],
    setSelling: React.Dispatch<React.SetStateAction<SteamItem[]>>,
    hexColor: string,
    loading?: boolean
}) {
    function add() {
        setSelling([...selling, item])
    }


    return (
        <div
            className="bg-accent h-50 w-full md:w-49 rounded-sm relative transition-all duration-200 hover:scale-[1.04] hover:-translate-y-1 hover:z-10 hover:[box-shadow:0_8px_20px_var(--glow),0_4px_10px_rgba(0,0,0,0.5)]"
            style={{ '--glow': `#${hexColor}44` } as React.CSSProperties}
        >
            <div className="flex justify-between mt-2 pl-2 pr-2 w-full absolute z-2">
                <h1 style={{ color: `#${hexColor}` }} className="text-[14px] w-35">
                    {item.market_name}
                </h1>

                <h1 className="text-[14px]">
                    [x{quantity}]
                </h1>
            </div>

            <div className="absolute inset-0 flex justify-center items-center z-0 mb-5" style={{ filter: `drop-shadow(0 0 8px #${hexColor}99)` }}>
                <Image
                    src={item.icon}
                    alt="Failed To Load"
                    style={{ width: 'auto' }}
                    width={100}
                    height={100}
                />
            </div>

            <div className="absolute bottom-10 left-0 px-2 flex items-baseline gap-2 z-2">
                <p className="text-[15px]">{loading ? '...' : `$${item.price.toFixed(2)}`}</p>
                {item.floatValue !== null && (
                    <p className="text-[11px] opacity-50 font-mono">{item.floatValue.toFixed(4)}</p>
                )}
            </div>

            <div className="flex justify-center bottom-0 w-full absolute">
                <button
                    onClick={add}
                    disabled={loading}
                    className="bg-less-special button rounded-sm w-full h-10"
                    style={{ borderTop: `2px solid #${hexColor}` }}
                 >
                    SELL
                </button>
            </div>
        </div>
    )
}

