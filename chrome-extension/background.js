chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type !== "FETCH_PENDING_SALES") return;

    fetch("https://skinslinger.com/api/extension/pending-sales", { credentials: "include" })
        .then(res => {
            if (!res.ok) throw new Error(`Request failed: ${res.status}`);
            return res.json();
        })
        .then(data => sendResponse({ ok: true, items: data.items }))
        .catch(err => sendResponse({ ok: false, error: String(err) }));

    return true; // keep the message channel open for the async response
});
