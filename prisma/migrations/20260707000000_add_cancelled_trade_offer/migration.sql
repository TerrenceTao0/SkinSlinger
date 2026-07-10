CREATE TABLE IF NOT EXISTS "cancelled_trade_offer" (
    "tradeOfferId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cancelled_trade_offer_pkey" PRIMARY KEY ("tradeOfferId")
);
