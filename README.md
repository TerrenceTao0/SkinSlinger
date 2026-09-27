# SkinSlinger

A full-stack peer-to-peer marketplace for Steam game items (CS2, Dota 2, Rust, TF2), built as a personal project to learn how real money, third-party APIs and untrusted users fit together in one system.

Users sign in with Steam, list items from their inventory, and buy from each other using a USDC balance on Polygon. There is no middleman bot holding items: the seller trades the item straight to the buyer, and the server acts as escrow. It only releases payment once it can verify the item arrived and can no longer be clawed back.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL · Prisma 7 · NextAuth · viem (Polygon) · Chrome Extension (MV3) · Vercel

## What it does

- **Browse and buy**: server-rendered market pages per game with search, infinite scroll, item detail pages (float, pattern and sticker data for CS2), a basket, and checkout.
- **Sell from your Steam inventory**: the inventory loads live from Steam, prices stream in as they resolve, and items can be listed or repriced at any time.
- **Buy orders**: users can place standing bids with cash reserved up front. A new listing is matched against the best bid automatically.
- **Order tracking**: buyers and sellers follow each purchase through delivery, escrow and payout, with optional email notifications.
- **Crypto wallet**: deposit USDC to a one-time address, withdraw to any Polygon wallet.
- **Seller browser extension**: adds the right items to the Steam trade offer and reports trade status back to the site.

## Engineering highlights

These are the problems that took the most thought.

### An escrow state machine that can't pay out twice

```
checkout ──► pending ──► holding ──(8 days)──► completed   (seller paid)
                │            └───────────────► reversed    (buyer refunded)
                └──► cancelled (buyer refunded, listing restored)
```

Money moves in several places: a cron job, a cancel endpoint, and reports from the extension. These can run at the same time on the same order. Every transition is a conditional write inside a transaction (`updateMany where status = 'holding'`, then credit only if a row actually changed). If two processes race, only one of them moves money. See `app/api/cron/process-purchases/route.ts`.

### Verifying delivery when the ID changes

My first version checked the buyer's inventory for the item's asset ID. It never matched, because Steam assigns a **new asset ID when an item is traded**. The fix was to match on properties that survive a trade. For CS2 skins that means the exact float value and paint seed, which are effectively unique per item. For stackable items it falls back to name matching. See `verifyBuyerHasItem` in `lib/steam.ts`.

### Protecting buyers from trade reversals

Steam lets a sender reverse a trade for about 7 days. Without protection, a seller could deliver, get paid, and then pull the item back. Payment is therefore held for **8 days** after delivery. The server then checks again: if the item is still with the buyer, the seller is paid; if it's gone, the buyer is refunded.

### Accepting crypto deposits without a payment processor

- Each deposit gets a fresh address from an HD wallet (BIP-32 derivation), so payments can be attributed without asking users to include a memo.
- A cron job scans USDC `Transfer` event logs for those addresses and resumes from the last processed block.
- Funds are swept to the main wallet. When a deposit address has no gas, the main wallet sends it a small amount of POL first.
- Users are credited with the amount that **actually arrived**, not the amount they said they'd send. A sweep that fails is retried on the next run.
- Withdrawals deduct the balance first and refund it if the on-chain transfer fails, so a crash can't leave free money behind.

Code: `lib/crypto/`.

### A browser extension that uses the seller's own Steam session

Steam doesn't offer a public API for sending trade offers from a user's account, so the extension works inside the seller's logged-in browser. It pre-fills the trade offer with the items owed, but never clicks send. Every 5 minutes it reads the seller's sent-offers page and reports whether each offer is active, gone or accepted. When an order is cancelled on the site, its trade offer is queued, and the extension cancels it on Steam. Code: `chrome-extension/`.

## Architecture

```
Browser ──► Next.js (Vercel)
              ├─ Server Components: market, item, inventory pages (SSR + JSON-LD)
              ├─ Route Handlers:    /api/checkout, /api/listings, /api/market/orders, ...
              ├─ Cron jobs:         purchases (5 min), deposits (1 min), prices (daily)
              └─ Prisma ──► PostgreSQL
                    │
   External:  Steam OpenID · steamwebapi.com (inventory, prices, floats)
              Polygon RPC (USDC) · Resend (email)

Seller's browser ── Chrome extension ──► steamcommunity.com + /api/extension/*
```

```
app/          Pages and API route handlers
lib/          Auth, Steam client, crypto payments, email helpers, Prisma client
prisma/       Schema and migrations
chrome-extension/  Seller trade helper
```
