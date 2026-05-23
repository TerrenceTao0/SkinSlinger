const base_url = "https://api.steamapis.com";
const api_headers = { "x-api-key": process.env.STEAM_APIS_KEY! };

const game_ids = {
    "CS2": 730,
    "Dota2": 570,
    "Rust": 252490
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
}


export function getStacked(inventory: SteamItem[]) {
    return inventory.map(item => ({ ...item, quantity: 1 }));
}


// Fetches item metadata and today's price from steamapis using the market hash name.
// Returns the steamapis document ID (used to identify the item in our DB) and price.
// Returns null if the item is not found or the request fails.
export async function fetchItemPrice(market_hash_name: string, game: string): Promise<{ price: number, docId: string } | null> {
    const app_id = game_ids[game as keyof typeof game_ids] ?? game_ids["CS2"];

    const response = await fetch(
        `${base_url}/v2/steam/items/${app_id}/${encodeURIComponent(market_hash_name)}`,
        { headers: api_headers }
    );


    if (!response.ok) return null;

    const data = await response.json();
    const result = data.result;

    if (!result) return null;

    const docId = result.item?._id;
    const price = result.priceHistory?.data?.[0]?.price ?? 0;

    if (!docId) return null;

    return { price, docId };
}


// Fetches a player's inventory for a given app from steamapis.
// Returns an array of tradable items with price set to 0 (prices are looked up separately from our DB).
async function fetchGameInventory(steam_id: string, app_id: number, game: string): Promise<SteamItem[]> {
    const response = await fetch(
        `${base_url}/steam/inventory/${steam_id}/${app_id}/2`,
        { headers: api_headers }
    );

    if (!response.ok) return [];

    const data = await response.json();

    if (!data.assets || !data.descriptions) return [];

    const descriptions = new Map<string, any>(
        data.descriptions.map((d: any) => [d.classid, d])
    );

    const items = data.assets.map((asset: any) => {
        const desc = descriptions.get(asset.classid);

        return {
            assetId: `${game}:${asset.assetid}`,
            market_name: desc.market_name,
            market_hash_name: desc.market_hash_name,
            icon: `https://community.cloudflare.steamstatic.com/economy/image/${desc.icon_url}`,
            tradable: desc.tradable === 1,
            type: desc.type,
            price: 0,
            hexColor: desc.name_color,
            game,
            commodity: desc.commodity === 1,
        };
    });


    return items.filter((item: any) => item.tradable);
}


// Fetches a user's combined inventory.
export async function getInventory(steam_id: string): Promise<SteamItem[]> {
    const [cs2, dota2] = await Promise.all([
        fetchGameInventory(steam_id, game_ids["CS2"], "CS2"),
        fetchGameInventory(steam_id, game_ids["Dota2"], "Dota2"),
        fetchGameInventory(steam_id, game_ids["Rust"], "Rust"),
    ]);


    return [...cs2, ...dota2];
}

