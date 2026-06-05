const base_url = "https://www.steamwebapi.com";
const api_key = process.env.STEAM_WEB_KEY!;

const game_slugs: Record<string, string> = {
    "CS2": "cs2",
    "Dota2": "dota2",
    "Rust": "rust",
    "TF2": "tf2",
};

export type SteamSticker = {
    stickerId: number
    slot: number
    name: string
    image: string
    wear: number | null
}

export type SteamItem = {
    assetId: string,
    market_name: string,
    market_hash_name: string,
    icon: string,
    tradable: boolean,
    type: string,
    price: number,
    hexColor: string,
    game: string,
    commodity: boolean,
    inspectLink: string | null,
    floatValue: number | null,
    paintSeed: number | null,
    stickers: SteamSticker[] | null,
}


export function getStacked(inventory: SteamItem[]) {
    return inventory.map(item => ({ ...item, quantity: 1 }));
}


const tradeCache = new Map<string, { allowed: boolean; reason: string | null; at: number }>();
const TRADE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

const TRADE_URL_PATTERN = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=(\d+)&token=[a-zA-Z0-9_-]+$/;

// Checks whether a Steam account can trade. Returns { allowed, reason }.
// Fails open (allows trade) if external APIs are unavailable.
export async function checkCanTrade(
    steamId: string,
    tradeUrl?: string | null,
): Promise<{ allowed: boolean; reason: string | null }> {
    const cached = tradeCache.get(steamId);
    if (cached && Date.now() - cached.at < TRADE_CACHE_TTL) {
        return { allowed: cached.allowed, reason: cached.reason };
    }

    const store = (result: { allowed: boolean; reason: string | null }) => {
        tradeCache.set(steamId, { ...result, at: Date.now() });
        return result;
    };

    if (!tradeUrl) return store({ allowed: true, reason: null });

    if (!TRADE_URL_PATTERN.test(tradeUrl)) {
        return store({ allowed: false, reason: "corrupt_url" });
    }

    try {
        const url = new URL(`${base_url}/steam/api/profile/trade-eligibility`);
        url.searchParams.set("key", api_key);
        url.searchParams.set("trade_url", tradeUrl);

        const res = await fetch(url.toString());
        if (!res.ok) return { allowed: true, reason: null }; // fail open — don't cache errors

        const data = await res.json();

        if (!data.tradeurlvalid) {
            return store({ allowed: false, reason: "Your Steam account cannot trade at this time." });
        }

        if (data.isescrow && data.escrowdays > 0) {
            const liftDate = new Date(Date.now() + data.escrowdays * 24 * 60 * 60 * 1000);
            const formatted = liftDate.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" });
            return store({ allowed: false, reason: `Your Steam account has a trade hold due to Steam Guard settings. It lifts on ${formatted}.` });
        }

        return store({ allowed: true, reason: null });
    } catch {
        return { allowed: true, reason: null }; // fail open — don't cache errors
    }
}


// Fetches today's price for an item from steamwebapi using the market hash name.
// Returns null if the item is not found or the request fails.
export async function fetchItemPrice(market_hash_name: string, _game: string, _name: string): Promise<number | null> {
    try {
        const url = new URL(`${base_url}/steam/api/item`);
        url.searchParams.set("key", api_key);
        url.searchParams.set("market_hash_name", market_hash_name);
        url.searchParams.set("markets", "skinport");

        const response = await fetch(url.toString());
        if (!response.ok) return null;

        const data = await response.json();
        const price = data.pricereal || data.pricelatest || 0;

        return price || null;
    } catch {
        return null;
    }
}


// Fetches float, pattern, and sticker data for a CS2 item via its inspect link.
export async function fetchItemFloat(inspectLink: string): Promise<{ floatValue: number | null; paintSeed: number | null; stickers: SteamSticker[] } | null> {
    try {
        const url = new URL(`${base_url}/steam/api/float`);
        url.searchParams.set("key", api_key);
        url.searchParams.set("url", inspectLink);

        const res = await fetch(url.toString());
        if (!res.ok) return null;

        const data = await res.json();

        return {
            floatValue: data.float ?? null,
            paintSeed: data.paintseed ?? null,
            stickers: (data.stickers ?? []).map((s: any) => ({
                stickerId: s.stickerId,
                slot: s.slot,
                name: s.name,
                image: s.image,
                wear: s.wear ?? null,
            })),
        };
    } catch {
        return null;
    }
}


// Fetches a player's inventory for any supported game from steamwebapi.
// Returns tradable items with price set to 0 (prices are looked up separately from our DB).
async function fetchGameInventory(steam_id: string, game: string): Promise<SteamItem[]> {
    try {
        const slug = game_slugs[game] ?? "cs2";
        const url = new URL(`${base_url}/steam/api/inventory`);
        url.searchParams.set("key", api_key);
        url.searchParams.set("steam_id", steam_id);
        url.searchParams.set("game", slug);

        const response = await fetch(url.toString());
        if (!response.ok) return [];

        const items: any[] = await response.json();
        if (!Array.isArray(items)) return [];

        return items
            .filter((item: any) => item.tradable)
            .map((item: any) => ({
                assetId: `${game}:${item.assetid}`,
                market_name: item.marketname,
                market_hash_name: item.markethashname,
                icon: item.image,
                tradable: true,
                type: item.itemtype ?? '',
                price: 0,
                hexColor: item.color ?? item.bordercolor ?? '',
                game,
                commodity: game === 'CS2' ? !(item.float?.paintindex) : true,
                inspectLink: item.inspectlink ?? null,
                floatValue: item.float?.floatvalue ?? null,
                paintSeed: item.float?.paintseed ?? null,
                stickers: item.float?.stickers ?? null,
            }));
    } catch {
        return [];
    }
}


// Fetches inventory for a specific subset of games (used for targeted verification).
export async function fetchInventoryForGames(steam_id: string, games: string[]): Promise<SteamItem[]> {
    const results = await Promise.all(games.map(game => fetchGameInventory(steam_id, game)));
    return results.flat();
}


// Fetches a user's combined inventory.
export async function getInventory(steam_id: string): Promise<SteamItem[]> {
    const [cs2, dota2, rust, tf2] = await Promise.all([
        fetchGameInventory(steam_id, 'CS2'),
        fetchGameInventory(steam_id, 'Dota2'),
        fetchGameInventory(steam_id, 'Rust'),
        fetchGameInventory(steam_id, 'TF2'),
    ]);


    return [...cs2, ...dota2, ...rust, ...tf2];
}

