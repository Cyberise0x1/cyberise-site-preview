CREATE TABLE "credential_email_deliveries" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockToken" TEXT,
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credential_email_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "credential_email_deliveries_orderId_key"
    ON "credential_email_deliveries"("orderId");
CREATE INDEX "credential_email_deliveries_status_nextAttemptAt_idx"
    ON "credential_email_deliveries"("status", "nextAttemptAt");
CREATE INDEX "credential_email_deliveries_status_lockedAt_idx"
    ON "credential_email_deliveries"("status", "lockedAt");

ALTER TABLE "credential_email_deliveries"
    ADD CONSTRAINT "credential_email_deliveries_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;