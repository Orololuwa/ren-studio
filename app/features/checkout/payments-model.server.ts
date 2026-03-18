import type { PaymentStatus, Prisma } from "~/generated/client";
import { prisma } from "~/utils/database.server";

export async function upsertPaymentToDatabaseByProviderAndProviderPaymentId({
  provider,
  providerPaymentId,
  create,
  update,
}: {
  provider: string;
  providerPaymentId: string;
  create: Prisma.PaymentCreateInput;
  update: Prisma.PaymentUpdateInput;
}) {
  return await prisma.payment.upsert({
    create,
    update,
    where: {
      provider_providerPaymentId: {
        provider,
        providerPaymentId,
      },
    },
  });
}

export async function updatePaymentStatusInDatabaseByProviderAndProviderPaymentId({
  provider,
  providerPaymentId,
  status,
  data = {},
}: {
  provider: string;
  providerPaymentId: string;
  status: PaymentStatus;
  data?: Prisma.PaymentUpdateInput;
}) {
  return await prisma.payment.update({
    data: { ...data, status },
    where: {
      provider_providerPaymentId: {
        provider,
        providerPaymentId,
      },
    },
  });
}

export async function retrievePaymentFromDatabaseByProviderAndProviderPaymentId({
  provider,
  providerPaymentId,
}: {
  provider: string;
  providerPaymentId: string;
}) {
  return await prisma.payment.findUnique({
    where: {
      provider_providerPaymentId: {
        provider,
        providerPaymentId,
      },
    },
  });
}
