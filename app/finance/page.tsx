

//

export default async function Finance() {
    return (
        <div className="h-full w-full flex justify-center items-center">
            <div className="w-100 h-60 flex justify-center items-center bg-secondary gap-5 frame-shadow">
                <div className="flex gap-5 mt-35">
                    <button className="bg-special w-40 h-15 rounded-[5px] button">
                        DEPOSIT
                    </button>

                    <button className="bg-special w-40 h-15 rounded-[5px] button">
                        WITHDRAW
                    </button>
                </div>
            </div>
        </div>
    )
}

