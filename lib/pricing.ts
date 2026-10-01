export type Sticker = { name: string, wear: number | null };

// Highest listing price allowed, as a multiple of the item's market value
const MAX_LISTING_MARKUP = 3;

// Lowest listing price allowed, as a fraction of the item's market price (0.1 = -90%)
const MIN_LISTING_FRACTION = 0.1;

//

export function stickerMarketName(name: string): string {
    return `Sticker | ${name}`;
}

// Stickers add 15% of their market price to an item's value, less their wear
export function stickerValue(stickers: Sticker[] | null | undefined, priceOf: (marketName: string) => number): number {
    if (!stickers) return 0;

    return stickers.reduce((sum, s) => sum + priceOf(stickerMarketName(s.name)) * (1 - (s.wear ?? 0)) * 0.15, 0);
}

// Highest price an item can be listed for, or null when it has no market price to compare against
export function maxListingPrice(marketPrice: number, stickers: Sticker[] | null | undefined, priceOf: (marketName: string) => number): number | null {
    if (marketPrice <= 0) return null;

    return Math.round((marketPrice + stickerValue(stickers, priceOf)) * MAX_LISTING_MARKUP * 100) / 100;
}

// Lowest price an item can be listed for, rounded up to the cent; null when it has no market price
export function minListingPrice(marketPrice: number): number | null {
    if (marketPrice <= 0) return null;

    return Math.max(0.01, Math.ceil(marketPrice * MIN_LISTING_FRACTION * 100 - 1e-6) / 100);
}
