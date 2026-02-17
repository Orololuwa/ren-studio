import { describe, expect, test } from "vitest";

import type { InvoiceItem } from "../../shared/types";
import {
  calculateDiscount,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  recalculateFooterFromItems,
} from "../../shared/utils/calculations";

describe("Invoice Calculations", () => {
  describe("calculateSubtotal", () => {
    test("given: items with valid quantity and unit price, should: return the sum of (qty × price)", () => {
      const items: InvoiceItem[] = [
        {
          description: "Item A",
          quantity: "2",
          unitPrice: "50.00",
          total: "100.00",
        },
        {
          description: "Item B",
          quantity: "3",
          unitPrice: "25.00",
          total: "75.00",
        },
      ];

      const result = calculateSubtotal(items);

      expect(result).toBe(175);
    });

    test("given: an empty items array, should: return 0", () => {
      const result = calculateSubtotal([]);

      expect(result).toBe(0);
    });

    test("given: items with zero quantity, should: return 0 for those items", () => {
      const items: InvoiceItem[] = [
        {
          description: "Item A",
          quantity: "0",
          unitPrice: "50.00",
          total: "0",
        },
      ];

      const result = calculateSubtotal(items);

      expect(result).toBe(0);
    });

    test("given: items with zero unit price, should: return 0 for those items", () => {
      const items: InvoiceItem[] = [
        { description: "Item A", quantity: "5", unitPrice: "0", total: "0" },
      ];

      const result = calculateSubtotal(items);

      expect(result).toBe(0);
    });

    test("given: items with missing quantity, should: default to 0", () => {
      const items: InvoiceItem[] = [
        { description: "Item A", quantity: "", unitPrice: "50.00", total: "0" },
      ];

      const result = calculateSubtotal(items);

      expect(result).toBe(0);
    });

    test("given: items with missing unit price, should: default to 0", () => {
      const items: InvoiceItem[] = [
        { description: "Item A", quantity: "5", unitPrice: "", total: "0" },
      ];

      const result = calculateSubtotal(items);

      expect(result).toBe(0);
    });

    test("given: a single item, should: return qty × price", () => {
      const items: InvoiceItem[] = [
        {
          description: "Consulting",
          quantity: "10",
          unitPrice: "100.00",
          total: "1000.00",
        },
      ];

      const result = calculateSubtotal(items);

      expect(result).toBe(1000);
    });

    test("given: items with decimal quantities, should: calculate correctly", () => {
      const items: InvoiceItem[] = [
        {
          description: "Hours",
          quantity: "1.5",
          unitPrice: "100.00",
          total: "150.00",
        },
      ];

      const result = calculateSubtotal(items);

      expect(result).toBe(150);
    });
  });

  describe("calculateTax", () => {
    test("given: percentage mode with valid rate and subtotal, should: return taxAmount = subtotal × (rate / 100)", () => {
      const result = calculateTax(1000, 10, 0, "percentage");

      expect(result.taxAmount).toBe(100);
      expect(result.taxRate).toBe(10);
    });

    test("given: percentage mode with zero rate, should: return the existing taxAmount unchanged", () => {
      const result = calculateTax(1000, 0, 50, "percentage");

      expect(result.taxAmount).toBe(50);
      expect(result.taxRate).toBe(0);
    });

    test("given: percentage mode with zero subtotal, should: return the existing taxAmount unchanged", () => {
      const result = calculateTax(0, 10, 25, "percentage");

      expect(result.taxAmount).toBe(25);
      expect(result.taxRate).toBe(10);
    });

    test("given: amount mode with valid amount and subtotal, should: recalculate taxRate from amount", () => {
      const result = calculateTax(1000, 0, 100, "amount");

      expect(result.taxAmount).toBe(100);
      expect(result.taxRate).toBe(10);
    });

    test("given: amount mode with zero amount, should: return the existing taxRate unchanged", () => {
      const result = calculateTax(1000, 5, 0, "amount");

      expect(result.taxAmount).toBe(0);
      expect(result.taxRate).toBe(5);
    });

    test("given: amount mode with zero subtotal, should: return the existing taxRate unchanged", () => {
      const result = calculateTax(0, 5, 100, "amount");

      expect(result.taxAmount).toBe(100);
      expect(result.taxRate).toBe(5);
    });
  });

  describe("calculateDiscount", () => {
    test("given: percentage mode with valid rate and subtotal, should: return discount = subtotal × (rate / 100)", () => {
      const result = calculateDiscount(1000, 15, 0, "percentage");

      expect(result.discount).toBe(150);
      expect(result.discountRate).toBe(15);
    });

    test("given: percentage mode with zero rate, should: return the existing discount unchanged", () => {
      const result = calculateDiscount(1000, 0, 50, "percentage");

      expect(result.discount).toBe(50);
      expect(result.discountRate).toBe(0);
    });

    test("given: percentage mode with zero subtotal, should: return the existing discount unchanged", () => {
      const result = calculateDiscount(0, 10, 25, "percentage");

      expect(result.discount).toBe(25);
      expect(result.discountRate).toBe(10);
    });

    test("given: amount mode with valid amount and subtotal, should: recalculate discountRate from amount", () => {
      const result = calculateDiscount(1000, 0, 200, "amount");

      expect(result.discount).toBe(200);
      expect(result.discountRate).toBe(20);
    });

    test("given: amount mode with zero amount, should: return the existing discountRate unchanged", () => {
      const result = calculateDiscount(1000, 5, 0, "amount");

      expect(result.discount).toBe(0);
      expect(result.discountRate).toBe(5);
    });

    test("given: amount mode with zero subtotal, should: return the existing discountRate unchanged", () => {
      const result = calculateDiscount(0, 5, 100, "amount");

      expect(result.discount).toBe(100);
      expect(result.discountRate).toBe(5);
    });
  });

  describe("calculateTotal", () => {
    test("given: subtotal, tax, and discount, should: return subtotal + tax - discount", () => {
      const result = calculateTotal(1000, 100, 50);

      expect(result).toBe(1050);
    });

    test("given: no tax and no discount, should: return the subtotal unchanged", () => {
      const result = calculateTotal(500, 0, 0);

      expect(result).toBe(500);
    });

    test("given: only tax, should: return subtotal + tax", () => {
      const result = calculateTotal(1000, 100, 0);

      expect(result).toBe(1100);
    });

    test("given: only discount, should: return subtotal - discount", () => {
      const result = calculateTotal(1000, 0, 150);

      expect(result).toBe(850);
    });

    test("given: all zeroes, should: return 0", () => {
      const result = calculateTotal(0, 0, 0);

      expect(result).toBe(0);
    });

    test("given: discount exceeding subtotal + tax, should: return a negative number", () => {
      const result = calculateTotal(100, 10, 200);

      expect(result).toBe(-90);
    });
  });

  describe("recalculateFooterFromItems", () => {
    test("given: items and footer with percentage tax, should: recalculate all totals", () => {
      const items: InvoiceItem[] = [
        { description: "A", quantity: "2", unitPrice: "100", total: "200" },
        { description: "B", quantity: "1", unitPrice: "50", total: "50" },
      ];
      const footerData = {
        subtotal: "0",
        taxRate: "10",
        taxAmount: "0",
        taxMode: "percentage",
        discountRate: "5",
        discount: "0",
        discountMode: "percentage",
        total: "0",
      };

      const result = recalculateFooterFromItems(items, footerData);

      expect(result.subtotal).toBe("250.00");
      expect(result.taxAmount).toBe("25.00");
      expect(result.taxRate).toBe("10.00");
      expect(result.discount).toBe("12.50");
      expect(result.discountRate).toBe("5.00");
      expect(result.total).toBe("262.50");
    });

    test("given: items and footer with amount tax mode, should: recalculate rate from fixed amount", () => {
      const items: InvoiceItem[] = [
        { description: "A", quantity: "4", unitPrice: "25", total: "100" },
      ];
      const footerData = {
        subtotal: "0",
        taxRate: "0",
        taxAmount: "15",
        taxMode: "amount",
        discountRate: "0",
        discount: "10",
        discountMode: "amount",
        total: "0",
      };

      const result = recalculateFooterFromItems(items, footerData);

      expect(result.subtotal).toBe("100.00");
      expect(result.taxAmount).toBe("15.00");
      expect(result.taxRate).toBe("15.00");
      expect(result.discount).toBe("10.00");
      expect(result.discountRate).toBe("10.00");
      expect(result.total).toBe("105.00");
    });

    test("given: empty items, should: set subtotal to 0 and preserve existing footer values", () => {
      const footerData = {
        subtotal: "500",
        taxRate: "10",
        taxAmount: "50",
        taxMode: "percentage",
        discountRate: "0",
        discount: "0",
        discountMode: "percentage",
        total: "550",
      };

      const result = recalculateFooterFromItems([], footerData);

      expect(result.subtotal).toBe("0.00");
      expect(result.taxAmount).toBe("50.00");
      expect(result.total).toBe("50.00");
    });

    test("given: footer with extra fields, should: preserve them in the result", () => {
      const items: InvoiceItem[] = [
        { description: "A", quantity: "1", unitPrice: "100", total: "100" },
      ];
      const footerData = {
        subtotal: "0",
        taxRate: "0",
        taxAmount: "0",
        taxMode: "percentage",
        discountRate: "0",
        discount: "0",
        discountMode: "percentage",
        total: "0",
        paymentTerms: "Net 30",
        notes: "Thank you!",
      };

      const result = recalculateFooterFromItems(items, footerData);

      expect(result.paymentTerms).toBe("Net 30");
      expect(result.notes).toBe("Thank you!");
      expect(result.subtotal).toBe("100.00");
      expect(result.total).toBe("100.00");
    });
  });
});
