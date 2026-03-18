-- Add checkout feature tables

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM (
    'pending',
    'processing',
    'succeeded',
    'failed',
    'canceled',
    'refunded',
    'partially_refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "CheckoutPage" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "sections" JSONB NOT NULL,
  "globalStyles" JSONB NOT NULL,
  "colorPalette" JSONB,
  "receiptTemplateId" TEXT,
  "paymentProviders" TEXT[],
  "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
  "allowedCurrencies" TEXT[],
  "isPasswordProtected" BOOLEAN NOT NULL DEFAULT false,
  "passwordHash" TEXT,
  "passwordHint" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "expiresAt" TIMESTAMP(3),
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "paymentCount" INTEGER NOT NULL DEFAULT 0,
  "totalRevenueMinor" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "CheckoutPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "checkoutPageId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerPaymentId" TEXT NOT NULL,
  "providerCustomerId" TEXT,
  "amountMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" "PaymentStatus" NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "customerName" TEXT,
  "customerPhone" TEXT,
  "billingAddress" JSONB,
  "items" JSONB NOT NULL,
  "metadata" JSONB,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Receipt" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "templateId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "sections" JSONB NOT NULL,
  "globalStyles" JSONB NOT NULL,
  "colorPalette" JSONB,
  "receiptNumber" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentToEmail" TEXT,
  "sentAt" TIMESTAMP(3),
  CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CheckoutPage_slug_key" ON "CheckoutPage"("slug");
CREATE INDEX IF NOT EXISTS "CheckoutPage_organizationId_idx" ON "CheckoutPage"("organizationId");
CREATE INDEX IF NOT EXISTS "CheckoutPage_slug_idx" ON "CheckoutPage"("slug");
CREATE INDEX IF NOT EXISTS "CheckoutPage_isActive_idx" ON "CheckoutPage"("isActive");

CREATE INDEX IF NOT EXISTS "Payment_checkoutPageId_idx" ON "Payment"("checkoutPageId");
CREATE INDEX IF NOT EXISTS "Payment_providerPaymentId_idx" ON "Payment"("providerPaymentId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "Payment_customerEmail_idx" ON "Payment"("customerEmail");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_provider_providerPaymentId_key" ON "Payment"("provider", "providerPaymentId");

CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_paymentId_key" ON "Receipt"("paymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");
CREATE INDEX IF NOT EXISTS "Receipt_paymentId_idx" ON "Receipt"("paymentId");
CREATE INDEX IF NOT EXISTS "Receipt_receiptNumber_idx" ON "Receipt"("receiptNumber");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "CheckoutPage"
    ADD CONSTRAINT "CheckoutPage_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "CheckoutPage"
    ADD CONSTRAINT "CheckoutPage_receiptTemplateId_fkey"
    FOREIGN KEY ("receiptTemplateId") REFERENCES "templates"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Payment"
    ADD CONSTRAINT "Payment_checkoutPageId_fkey"
    FOREIGN KEY ("checkoutPageId") REFERENCES "CheckoutPage"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Receipt"
    ADD CONSTRAINT "Receipt_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "templates"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Receipt"
    ADD CONSTRAINT "Receipt_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "Payment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

