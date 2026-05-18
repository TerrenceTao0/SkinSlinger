import ItemCard from './components/ItemCard'

const items = [
    {
        name: "Gun 1",
        price: 10.00,
        quantity: 1
    },

    {
        name: "Gun 2",
        price: 10.00,
        quantity: 1
    },

    {
        name: "Gun 3",
        price: 10.00,
        quantity: 1
    },

    {
        name: "Gun 4",
        price: 10.00,
        quantity: 1
    },

    {
        name: "Gun 5",
        price: 10.00,
        quantity: 1
    },

    {
        name: "Gun 6",
        price: 10.00,
        quantity: 1
    },

    {
        name: "Gun 7",
        price: 10.00,
        quantity: 1
    },

    {
        name: "Gun 8",
        price: 10.00,
        quantity: 1
    },
]

//

export default function App() {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="bg-secondary w-46 h-210 absolute left-4 mt-14">

            </div>

            <div className="bg-secondary w-420 h-210 ml-50 mt-14 gap-y-50 grid grid-cols-7 grid-rows-4">
                {items.map((item) => (
                    <ItemCard key={item.name} name={item.name} price={item.price} quantity={item.quantity} />
                ))}
            </div>
        </div>
    );
}

