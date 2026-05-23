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

const KEY = "bifrost_basket";

export function getBasket(): BasketItem[] {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); }
    catch { return []; }
}

export function saveBasket(basket: BasketItem[]) {
    localStorage.setItem(KEY, JSON.stringify(basket));
}

export function clearBasket() {
    localStorage.removeItem(KEY);
}
