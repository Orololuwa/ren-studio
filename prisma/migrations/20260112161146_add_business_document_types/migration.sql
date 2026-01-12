-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TemplateType" ADD VALUE 'receipt';
ALTER TYPE "TemplateType" ADD VALUE 'quote';
ALTER TYPE "TemplateType" ADD VALUE 'proposal';
ALTER TYPE "TemplateType" ADD VALUE 'contract';
ALTER TYPE "TemplateType" ADD VALUE 'purchaseOrder';
ALTER TYPE "TemplateType" ADD VALUE 'estimate';
ALTER TYPE "TemplateType" ADD VALUE 'statement';
ALTER TYPE "TemplateType" ADD VALUE 'letter';
ALTER TYPE "TemplateType" ADD VALUE 'form';
ALTER TYPE "TemplateType" ADD VALUE 'label';
