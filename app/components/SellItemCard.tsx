import Image from "next/image";

export default function SellItemCard({ market_name, quantity, icon, hexColor, priceStr, setPriceStr, remove }: {
    market_name: string, quantity: number, icon: string, hexColor: string,
    priceStr: string, setPriceStr: (val: string) => void, remove: () => void
}) {
    return (
        <div className="bg-accent h-50 w-[95%] mt-3 mb-3 ml-2.25 rounded-sm relative">
            <div className="flex justify-between mt-2 pl-2 pr-2 w-full absolute z-10">
                <h1 className="text-1xl w-30" style={{ color: `#${hexColor}` }}>
                    {market_name}
                </h1>

                <h1 className="text-1xl">
                    x{quantity}
                </h1>
            </div>

            <div className="absolute inset-0 flex justify-center items-center z-0 mb-5" style={{ filter: `drop-shadow(0 0 8px #${hexColor}99)` }}>
                <Image
                    src={icon}
                    alt="Failed To Load"
                    style={{ width: 'auto' }}
                    width={100}
                    height={100}
                />
            </div>

            <div className="absolute bottom-7 w-full px-2 flex justify-between items-center z-10">
                <span className="text-[15px] opacity-70">Price</span>
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
                    className="bg-accent rounded-sm w-20 h-8 text-center outline-none border border-gray-500 text-[15px]"
                />
            </div>

            <div className="flex justify-end w-full absolute bottom-0">
                <button
                    className="w-full bg-remove h-7 flex justify-center items-center cursor-pointer text-[13px] button rounded-sm"
                    onClick={remove}
                >
                    REMOVE
                </button>
            </div>
        </div>
    )
}
