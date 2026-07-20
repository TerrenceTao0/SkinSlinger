-- Failed-attempt counter for the notification-email confirmation code,
-- so the code can't be brute-forced within its TTL.
ALTER TABLE "user" ADD COLUMN "emailCodeAttempts" INTEGER NOT NULL DEFAULT 0;
