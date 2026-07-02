// Runs in the page's own JS context (not the isolated content-script world), so it can
// call Steam's own trade-page functions directly instead of guessing at DOM clicks.
window.addEventListener("skinslinger-select-inventory", (event) => {
    const { appid, contextid } = event.detail;

    try {
        if (typeof TradePageSelectInventory !== "function" || typeof UserYou === "undefined") {
            throw new Error("TradePageSelectInventory or UserYou not found on this page");
        }

        TradePageSelectInventory(UserYou, appid, String(contextid));

        window.dispatchEvent(new CustomEvent("skinslinger-select-inventory-result", { detail: { ok: true } }));
    } catch (err) {
        window.dispatchEvent(new CustomEvent("skinslinger-select-inventory-result", { detail: { ok: false, error: String(err) } }));
    }
});
