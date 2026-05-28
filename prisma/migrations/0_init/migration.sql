-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "password" TEXT,
    "username" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "steam_trade_url" TEXT,
    "steam_id" TEXT,
    "steamApiKey" TEXT,
    "cash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "twoFactorCode" TEXT,
    "twoFactorExpires" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendingAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pendingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resetPassword" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resetPassword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "crypto_deposit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "amountUsdc" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "txHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crypto_deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_counter" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "lastBlock" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "deposit_counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item" (
    "marketName" TEXT NOT NULL,
    "marketHashName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "game" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_pkey" PRIMARY KEY ("marketName")
);

-- CreateTable
CREATE TABLE "item_float" (
    "assetId" TEXT NOT NULL,
    "floatValue" DOUBLE PRECISION,
    "paintSeed" INTEGER,
    "stickers" JSONB,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_float_pkey" PRIMARY KEY ("assetId")
);

-- CreateTable
CREATE TABLE "item_listing" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "marketName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "game" TEXT,
    "icon" TEXT,
    "hexColor" TEXT,
    "commodity" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "item_listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buy_order" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "marketName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "game" TEXT,
    "icon" TEXT,
    "hexColor" TEXT,

    CONSTRAINT "buy_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "price" DOUBLE PRECISION NOT NULL,
    "assetId" TEXT NOT NULL,
    "marketName" TEXT NOT NULL,
    "game" TEXT,
    "icon" TEXT,
    "hexColor" TEXT,
    "commodity" BOOLEAN NOT NULL DEFAULT false,
    "buyerTradeUrl" TEXT,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,

    CONSTRAINT "purchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_providerAccountId_key" ON "account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "pendingAccount_email_key" ON "pendingAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pendingAccount_username_key" ON "pendingAccount"("username");

-- CreateIndex
CREATE UNIQUE INDEX "pendingAccount_token_key" ON "pendingAccount"("token");

-- CreateIndex
CREATE UNIQUE INDEX "resetPassword_token_key" ON "resetPassword"("token");

-- CreateIndex
CREATE UNIQUE INDEX "resetPassword_email_key" ON "resetPassword"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_sessionToken_key" ON "session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verificationToken_token_key" ON "verificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verificationToken_identifier_token_key" ON "verificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_deposit_address_key" ON "crypto_deposit"("address");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_deposit_index_key" ON "crypto_deposit"("index");

-- CreateIndex
CREATE UNIQUE INDEX "item_listing_assetId_key" ON "item_listing"("assetId");

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_listing" ADD CONSTRAINT "item_listing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buy_order" ADD CONSTRAINT "buy_order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
