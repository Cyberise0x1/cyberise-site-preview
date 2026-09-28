ALTER TABLE "credential_email_deliveries"
ADD COLUMN "lastAttemptAt" TIMESTAMP(3);

UPDATE "credential_email_deliveries"
SET "lastAttemptAt" = "updatedAt"
WHERE "attempts" > 0;