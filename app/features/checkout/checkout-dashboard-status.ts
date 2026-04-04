export type CheckoutDashboardBadgeVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary";

export function checkoutDashboardStatusLabel({
  expiresAt,
  isActive,
  paymentCount,
}: {
  expiresAt: Date | null;
  isActive: boolean;
  paymentCount: number;
}): { label: string; variant: CheckoutDashboardBadgeVariant } {
  const now = Date.now();
  const expired = expiresAt != null && new Date(expiresAt).getTime() <= now;

  if (!isActive) {
    if (paymentCount > 0) {
      return { label: "Completed", variant: "secondary" };
    }
    return { label: "Inactive", variant: "outline" };
  }
  if (expired) {
    return { label: "Expired", variant: "destructive" };
  }
  return { label: "Active", variant: "default" };
}
