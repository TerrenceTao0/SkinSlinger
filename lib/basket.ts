export type BasketItem = {
    id: string,         // listing ID (representative for commodities)
    marketName: string,
    price: number,
    icon: string,
    hexColor: string,
    commodity: boolean,
    quantity: number,
    maxQuantity: number,
}

//

export function getBasket(): BasketItem[] {
    if (typeof window === "undefined") return [];

    try {
        return JSON.parse(localStorage.getItem("basket") ?? "[]");
    } catch {
        return [];
    }
}


export function saveBasket(basket: BasketItem[]) {
    localStorage.setItem("basket", JSON.stringify(basket));
}


export function clearBasket() {
    localStorage.removeItem("basket");
}

