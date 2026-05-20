-- CreateTable
CREATE TABLE "PendingAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingAccount_email_key" ON "PendingAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PendingAccount_username_key" ON "PendingAccount"("username");

-- CreateIndex
CREATE UNIQUE INDEX "PendingAccount_token_key" ON "PendingAccount"("token");
