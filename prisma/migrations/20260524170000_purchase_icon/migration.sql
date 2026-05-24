ALTER TABLE "purchase" ADD COLUMN "icon" TEXT;
ALTER TABLE "purchase" ADD COLUMN "hexColor" TEXT;
ALTER TABLE "purchase" ADD COLUMN "commodity" BOOLEAN NOT NULL DEFAULT false;
