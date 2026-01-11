-- CreateEnum
CREATE TYPE "OrganizationMembershipRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "StripeSubscriptionStatus" AS ENUM ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'paused', 'trialing', 'unpaid');

-- CreateEnum
CREATE TYPE "StripePriceInterval" AS ENUM ('day', 'week', 'month', 'year');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('resume', 'invoice', 'certificate', 'reportCards');

-- CreateTable
CREATE TABLE "UserAccount" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "billingEmail" TEXT NOT NULL DEFAULT '',
    "stripeCustomerId" TEXT,
    "trialEnd" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "memberId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "deactivatedAt" TIMESTAMP(3),
    "role" "OrganizationMembershipRole" NOT NULL DEFAULT 'member',

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("memberId","organizationId")
);

-- CreateTable
CREATE TABLE "OrganizationInviteLink" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "creatorId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "OrganizationInviteLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteLinkUse" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inviteLinkId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "InviteLinkUse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationEmailInviteLink" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invitedById" TEXT,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "OrganizationMembershipRole" NOT NULL DEFAULT 'member',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "OrganizationEmailInviteLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSalesFormSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "phoneNumber" TEXT NOT NULL DEFAULT '',
    "workEmail" TEXT NOT NULL,

    CONSTRAINT "ContactSalesFormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeProduct" (
    "stripeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxSeats" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "StripeProduct_pkey" PRIMARY KEY ("stripeId")
);

-- CreateTable
CREATE TABLE "StripeSubscription" (
    "stripeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "purchasedById" TEXT,
    "created" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL,
    "status" "StripeSubscriptionStatus" NOT NULL,

    CONSTRAINT "StripeSubscription_pkey" PRIMARY KEY ("stripeId")
);

-- CreateTable
CREATE TABLE "StripeSubscriptionItem" (
    "stripeId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "priceId" TEXT NOT NULL,

    CONSTRAINT "StripeSubscriptionItem_pkey" PRIMARY KEY ("stripeId")
);

-- CreateTable
CREATE TABLE "StripePrice" (
    "stripeId" TEXT NOT NULL,
    "lookupKey" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "unitAmount" INTEGER NOT NULL,
    "interval" "StripePriceInterval" NOT NULL,

    CONSTRAINT "StripePrice_pkey" PRIMARY KEY ("stripeId")
);

-- CreateTable
CREATE TABLE "StripeSubscriptionSchedule" (
    "stripeId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL,
    "currentPhaseStart" TIMESTAMP(3),
    "currentPhaseEnd" TIMESTAMP(3),

    CONSTRAINT "StripeSubscriptionSchedule_pkey" PRIMARY KEY ("stripeId")
);

-- CreateTable
CREATE TABLE "StripeSubscriptionSchedulePhase" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "priceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "StripeSubscriptionSchedulePhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPanel" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "lastOpenedAt" TIMESTAMP(3),

    CONSTRAINT "NotificationPanel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TemplateType" NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "globalStyles" JSONB NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockAccessTokenSession" (
    "accessToken" TEXT NOT NULL,
    "sessionData" JSONB NOT NULL,

    CONSTRAINT "MockAccessTokenSession_pkey" PRIMARY KEY ("accessToken")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_supabaseUserId_key" ON "UserAccount"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_stripeCustomerId_key" ON "Organization"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationInviteLink_token_key" ON "OrganizationInviteLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "InviteLinkUse_inviteLinkId_userId_key" ON "InviteLinkUse"("inviteLinkId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationEmailInviteLink_token_key" ON "OrganizationEmailInviteLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "StripePrice_lookupKey_key" ON "StripePrice"("lookupKey");

-- CreateIndex
CREATE UNIQUE INDEX "StripeSubscriptionSchedule_subscriptionId_key" ON "StripeSubscriptionSchedule"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRecipient_notificationId_userId_key" ON "NotificationRecipient"("notificationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPanel_userId_organizationId_key" ON "NotificationPanel"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "templates_organizationId_type_idx" ON "templates"("organizationId", "type");

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInviteLink" ADD CONSTRAINT "OrganizationInviteLink_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInviteLink" ADD CONSTRAINT "OrganizationInviteLink_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteLinkUse" ADD CONSTRAINT "InviteLinkUse_inviteLinkId_fkey" FOREIGN KEY ("inviteLinkId") REFERENCES "OrganizationInviteLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteLinkUse" ADD CONSTRAINT "InviteLinkUse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationEmailInviteLink" ADD CONSTRAINT "OrganizationEmailInviteLink_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationEmailInviteLink" ADD CONSTRAINT "OrganizationEmailInviteLink_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeSubscription" ADD CONSTRAINT "StripeSubscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeSubscription" ADD CONSTRAINT "StripeSubscription_purchasedById_fkey" FOREIGN KEY ("purchasedById") REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeSubscriptionItem" ADD CONSTRAINT "StripeSubscriptionItem_stripeSubscriptionId_fkey" FOREIGN KEY ("stripeSubscriptionId") REFERENCES "StripeSubscription"("stripeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeSubscriptionItem" ADD CONSTRAINT "StripeSubscriptionItem_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "StripePrice"("stripeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripePrice" ADD CONSTRAINT "StripePrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "StripeProduct"("stripeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeSubscriptionSchedule" ADD CONSTRAINT "StripeSubscriptionSchedule_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "StripeSubscription"("stripeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeSubscriptionSchedulePhase" ADD CONSTRAINT "StripeSubscriptionSchedulePhase_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "StripeSubscriptionSchedule"("stripeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeSubscriptionSchedulePhase" ADD CONSTRAINT "StripeSubscriptionSchedulePhase_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "StripePrice"("stripeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPanel" ADD CONSTRAINT "NotificationPanel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPanel" ADD CONSTRAINT "NotificationPanel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
