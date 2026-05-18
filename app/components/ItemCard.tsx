import Image from 'next/image'

//

export default function ItemCard({ name, price, quantity }: {
    name: string, 
    price: number,
    quantity: number
}) {
    return (
        <div className="bg-accent h-60 w-55 mt-3 ml-2.5 rounded-sm">
            <h1 className="flex ml-5 text-3xl mt-2">
                {name}
            </h1>

            <div className="flex justify-center items-center pt-4 drop-shadow-2xl">
                <Image
                    src="/items/template.png"
                    alt="Failed To Load"
                    width={150}
                    height={150}
                />
            </div>

            <p className="text-[5] ml-5">
                ${price.toFixed(2)}

                <br></br>

                For sale: {quantity}
            </p>

            <div className="flex justify-center">
                <button className="bg-special rounded-md button w-full h-10 mt-2">
                    ADD TO CART
                </button>
            </div>
        </div>
    )
}

