const POLL_ALARM = "pollTradeAcceptance";

chrome.runtime.onInstalled.addListener(() => chrome.alarms.create(POLL_ALARM, { periodInMinutes: 5 }));
chrome.runtime.onStartup.addListener(() => chrome.alarms.create(POLL_ALARM, { periodInMinutes: 5 }));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "FETCH_PENDING_SALES") {
        fetch("https://skinslinger.com/api/extension/pending-sales", { credentials: "include" })
            .then(res => {
                if (!res.ok) throw new Error(`Request failed: ${res.status}`);
                return res.json();
            })
            .then(data => sendResponse({ ok: true, items: data.items }))
            .catch(err => sendResponse({ ok: false, error: String(err) }));

        return true; // keep the message channel open for the async response
    }

    if (message.type === "TRADE_SENT") {
        fetch("https://skinslinger.com/api/purchase/mark-sent", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: message.orderIds, tradeofferid: message.tradeofferid }),
        }).catch(err => console.warn("SkinSlinger helper: failed to report trade sent", err));

        return false;
    }
});

// Once an item has been sent, Steam removes it from the seller's own inventory the
// moment the buyer accepts — checking our own inventory avoids the trade-lock
// visibility restriction Steam applies to third parties looking at a freshly-traded
// item in the buyer's inventory. Runs in the seller's real authenticated browser
// session, so it isn't subject to the anti-scraping treatment Steam gives
// datacenter/automated requests either.
async function pollTradeAcceptance() {
    const res = await fetch("https://skinslinger.com/api/extension/pending-sales", { credentials: "include" });
    if (!res.ok) return;

    const { sellerSteamId, items } = await res.json();
    if (!sellerSteamId) return;

    const sent = items.filter(item => item.tradeOfferId);
    if (sent.length === 0) return;

    const groups = new Map();
    for (const item of sent) {
        const key = `${item.appid}_${item.contextid}`;
        if (!groups.has(key)) groups.set(key, { appid: item.appid, contextid: item.contextid, items: [] });
        groups.get(key).items.push(item);
    }

    for (const { appid, contextid, items: groupItems } of groups.values()) {
        try {
            // Note: single page (up to 5000 items) — a seller inventory larger than that
            // could false-negative on an item that's actually still present on a later page.
            const invRes = await fetch(
                `https://steamcommunity.com/inventory/${sellerSteamId}/${appid}/${contextid}?l=english&count=5000`,
                { credentials: "include" }
            );
            if (!invRes.ok) continue;

            const inv = await invRes.json();
            const ownedAssetIds = new Set((inv.assets ?? []).map(a => String(a.assetid)));

            for (const item of groupItems) {
                if (!ownedAssetIds.has(String(item.assetId))) {
                    await fetch("https://skinslinger.com/api/extension/trade-status", {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderId: item.orderId }),
                    });
                }
            }
        } catch (err) {
            console.warn(`SkinSlinger helper: failed to poll inventory for ${appid}/${contextid}`, err);
        }
    }
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === POLL_ALARM) pollTradeAcceptance();
});
