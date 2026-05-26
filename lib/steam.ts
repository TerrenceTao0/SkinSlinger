const base_url = "https://api.steamapis.com";
const api_headers = { "x-api-key": process.env.STEAM_APIS_KEY! };

const game_ids = {
    "CS2": 730,
    "Dota2": 570,
    "Rust": 252490,
    "TF2": 440,
}

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


// Checks whether a Steam account can trade. Returns { allowed, reason }.
// Fails open (allows trade) if external APIs are unavailable.
export async function checkCanTrade(
    steamId: string,
    tradeUrl?: string | null,
): Promise<{ allowed: boolean; reason: string | null }> {
    try {
        // 1. Check economy/community ban via steamapis
        const banRes = await fetch(`${base_url}/v2/steam/users/${steamId}/bans`, { headers: api_headers });
        if (banRes.ok) {
            const data = await banRes.json();
            const result = data.result;
            if (result?.CommunityBanned) return { allowed: false, reason: "Your Steam account is community banned." };
            if (result?.EconomyBan === "banned") return { allowed: false, reason: "Your Steam account has a trade ban." };
        }

        // 2. Check trade hold via GetTradeHoldDurations (requires bot API key + trade URL token)
        const botKey = process.env.STEAM_SECRET;
        if (botKey && tradeUrl) {
            const token = new URL(tradeUrl).searchParams.get("token");
            if (token) {
                const holdRes = await fetch(
                    `https://api.steampowered.com/IEconService/GetTradeHoldDurations/v1/?key=${botKey}&steamid_target=${steamId}&trade_offer_access_token=${token}`
                );
                if (holdRes.ok) {
                    const holdData = await holdRes.json();
                    const escrowEnd = holdData.response?.their_escrow?.escrow_end_date ?? 0;
                    if (escrowEnd > 0) {
                        const liftDate = new Date(escrowEnd * 1000);
                        const formatted = liftDate.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" });
                        return { allowed: false, reason: `Your Steam account has a trade hold due to Steam Guard settings. It lifts on ${formatted}.` };
                    }
                }
            }
        }

        return { allowed: true, reason: null };
    } catch {
        return { allowed: true, reason: null }; // fail open
    }
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


// Fetches float, pattern, and sticker data for a CS2 item via its inspect link.
export async function fetchItemFloat(inspectLink: string): Promise<{ floatValue: number | null; paintSeed: number | null; stickers: SteamSticker[] } | null> {
    try {
        const res = await fetch(`https://api.csgofloat.com/?url=${encodeURIComponent(inspectLink)}`);
        if (!res.ok) return null;
        const data = await res.json();
        const info = data.iteminfo;
        if (!info) return null;
        return {
            floatValue: info.floatvalue ?? null,
            paintSeed: info.paintseed ?? null,
            stickers: (info.stickers ?? []).map((s: any) => ({
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

        const actions: { link: string; name: string }[] = desc.actions ?? [];
        const inspectAction = actions.find(a => a.name?.includes('Inspect'));
        const rawLink = inspectAction?.link ?? null;
        const inspectLink = rawLink
            ? rawLink.replace('%owner_steamid%', steam_id).replace('%assetid%', asset.assetid)
            : null;

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
            inspectLink,
            floatValue: null,
            paintSeed: null,
            stickers: null,
        };
    });


    return items.filter((item: any) => item.tradable);
}


// Fetches a user's combined inventory.
export async function getInventory(steam_id: string): Promise<SteamItem[]> {
    const [cs2, dota2, rust, tf2] = await Promise.all([
        fetchGameInventory(steam_id, game_ids["CS2"], "CS2"),
        fetchGameInventory(steam_id, game_ids["Dota2"], "Dota2"),
        fetchGameInventory(steam_id, game_ids["Rust"], "Rust"),
        fetchGameInventory(steam_id, game_ids["TF2"], "TF2"),
    ]);


    return [...cs2, ...dota2, ...rust, ...tf2];
}

