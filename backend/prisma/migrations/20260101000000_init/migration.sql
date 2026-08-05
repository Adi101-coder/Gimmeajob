-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'STOPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "QueueItemStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'SKIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LogStatus" AS ENUM ('SUCCESS', 'FAILED', 'SKIPPED', 'RETRY');

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "jobRole" TEXT NOT NULL,
    "dailyLimit" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "scheduledTime" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "totalContacts" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "todaySentCount" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailQueueItem" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "status" "QueueItemStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "subject" TEXT,
    "status" "LogStatus" NOT NULL,
    "smtpResponse" TEXT,
    "aiStatus" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportReport" (
    "id" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "validRows" INTEGER NOT NULL,
    "invalidRows" INTEGER NOT NULL,
    "duplicateRows" INTEGER NOT NULL,
    "errors" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");
CREATE INDEX "Campaign_createdAt_idx" ON "Campaign"("createdAt");
CREATE UNIQUE INDEX "Contact_email_key" ON "Contact"("email");
CREATE INDEX "Contact_email_idx" ON "Contact"("email");
CREATE INDEX "Contact_company_idx" ON "Contact"("company");
CREATE UNIQUE INDEX "EmailQueueItem_campaignId_contactId_key" ON "EmailQueueItem"("campaignId", "contactId");
CREATE INDEX "EmailQueueItem_campaignId_status_idx" ON "EmailQueueItem"("campaignId", "status");
CREATE INDEX "EmailQueueItem_status_scheduledAt_idx" ON "EmailQueueItem"("status", "scheduledAt");
CREATE INDEX "EmailQueueItem_scheduledAt_idx" ON "EmailQueueItem"("scheduledAt");
CREATE INDEX "EmailLog_campaignId_idx" ON "EmailLog"("campaignId");
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");
CREATE INDEX "EmailLog_recipient_idx" ON "EmailLog"("recipient");
CREATE INDEX "EmailLog_company_idx" ON "EmailLog"("company");
CREATE INDEX "EmailLog_sentAt_idx" ON "EmailLog"("sentAt");
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");
CREATE INDEX "ImportReport_createdAt_idx" ON "ImportReport"("createdAt");

-- AddForeignKey
ALTER TABLE "EmailQueueItem" ADD CONSTRAINT "EmailQueueItem_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailQueueItem" ADD CONSTRAINT "EmailQueueItem_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
