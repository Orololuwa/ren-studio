import { getCurrencyFromTemplateForCheckout } from "~/features/templates/shared/common-currencies";
import { getTemplateById } from "~/features/templates/shared/templates";
import type { Template } from "~/features/templates/shared/types";

/**
 * Resolves checkout currency from the selected invoice template: loader list
 * (org + built-ins from the route) first, then built-in-only `getTemplateById`.
 */
export function resolveInvoiceTemplateCurrency(
  templateId: string,
  loaderTemplates: Template[],
): string {
  const fromLoader = loaderTemplates.find((t) => t.id === templateId);
  if (fromLoader) {
    return getCurrencyFromTemplateForCheckout(fromLoader);
  }
  const builtin = getTemplateById(templateId);
  if (builtin) {
    return getCurrencyFromTemplateForCheckout(builtin);
  }
  return "USD";
}
