import type {
  CheckoutLineItem,
  CheckoutTotalsData,
} from "../checkout-sections";
import { recalculateCheckoutTotals } from "../checkout-sections";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";

type CheckoutTotalsFieldsProps = {
  lineItems: CheckoutLineItem[];
  totals: CheckoutTotalsData;
  onChange: (next: CheckoutTotalsData) => void;
  disabled?: boolean;
};

export function CheckoutTotalsFields({
  lineItems,
  totals,
  onChange,
  disabled = false,
}: CheckoutTotalsFieldsProps) {
  const patch = (partial: Partial<CheckoutTotalsData>) => {
    onChange(recalculateCheckoutTotals(lineItems, { ...totals, ...partial }));
  };

  return (
    <div className="space-y-4 rounded-md border bg-muted/10 p-4">
      <div className="text-sm font-medium">Tax & discount</div>
      <p className="text-muted-foreground text-xs">
        Same options as an invoice footer: percentage or fixed amounts, applied
        to the line-item subtotal.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tax mode</Label>
          <Select
            disabled={disabled}
            onValueChange={(v) =>
              patch({ taxMode: v as "percentage" | "amount" })
            }
            value={totals.taxMode}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="amount">Fixed amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {totals.taxMode === "percentage" ? (
          <div className="space-y-2">
            <Label>Tax rate (%)</Label>
            <Input
              disabled={disabled}
              onChange={(e) => patch({ taxRate: e.target.value })}
              type="text"
              value={totals.taxRate}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Tax amount</Label>
            <Input
              disabled={disabled}
              onChange={(e) => patch({ taxAmount: e.target.value })}
              type="text"
              value={totals.taxAmount}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={totals.showTaxRate}
          disabled={disabled}
          onCheckedChange={(v) => patch({ showTaxRate: Boolean(v) })}
        />
        <span>Show tax rate in labels (when applicable)</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Discount mode</Label>
          <Select
            disabled={disabled}
            onValueChange={(v) =>
              patch({ discountMode: v as "percentage" | "amount" })
            }
            value={totals.discountMode}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="amount">Fixed amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {totals.discountMode === "percentage" ? (
          <div className="space-y-2">
            <Label>Discount rate (%)</Label>
            <Input
              disabled={disabled}
              onChange={(e) => patch({ discountRate: e.target.value })}
              type="text"
              value={totals.discountRate}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Discount amount</Label>
            <Input
              disabled={disabled}
              onChange={(e) => patch({ discount: e.target.value })}
              type="text"
              value={totals.discount}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={totals.showDiscountRate}
          disabled={disabled}
          onCheckedChange={(v) => patch({ showDiscountRate: Boolean(v) })}
        />
        <span>Show discount rate in labels (when applicable)</span>
      </div>

      <div className="space-y-2">
        <Label>Payment terms (optional)</Label>
        <Textarea
          className="min-h-[72px]"
          disabled={disabled}
          onChange={(e) => patch({ paymentTerms: e.target.value })}
          placeholder="e.g. Net 30"
          value={totals.paymentTerms}
        />
      </div>

      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea
          className="min-h-[72px]"
          disabled={disabled}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="Shown on the public checkout summary"
          value={totals.notes}
        />
      </div>

      <div className="border-t pt-3 text-sm space-y-1">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{totals.subtotal}</span>
        </div>
        {Number(totals.taxAmount) > 0 ? (
          <div className="flex justify-between text-muted-foreground">
            <span>
              {totals.showTaxRate && Number(totals.taxRate) > 0
                ? `Tax (${totals.taxRate}%)`
                : "Tax"}
            </span>
            <span>{totals.taxAmount}</span>
          </div>
        ) : null}
        {Number(totals.discount) > 0 ? (
          <div className="flex justify-between text-muted-foreground">
            <span>
              {totals.showDiscountRate && Number(totals.discountRate) > 0
                ? `Discount (${totals.discountRate}%)`
                : "Discount"}
            </span>
            <span>−{totals.discount}</span>
          </div>
        ) : null}
        <div className="flex justify-between font-medium pt-1 border-t">
          <span>Total due</span>
          <span>{totals.total}</span>
        </div>
      </div>
    </div>
  );
}
