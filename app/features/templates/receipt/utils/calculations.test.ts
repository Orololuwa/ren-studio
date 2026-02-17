import { describe, expect, test } from "vitest";

import type { InvoiceItem } from "../../shared/types";
import {
  calculateDiscount,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
} from "../../shared/utils/calculations";

describe("Receipt Calculations", () => {
  describe("calculateSubtotal", () => {
    test("given: receipt items with valid quantity and unit price, should: return the sum of (qty × price)", () => {
      const items: InvoiceItem[] = [
        {
          description: "Product A",
          quantity: "1",
          unitPrice: "29.99",
          total: "29.99",
        },
        {
          description: "Product B",
          quantity: "2",
          unitPrice: "15.00",
          total: "30.00",
        },
      ];

      const result = calculateSubtotal(items);

      expect(result).toBeCloseTo(59.99, 2);
    });

    test("given: an empty items array, should: return 0", () => {
      const result = calculateSubtotal([]);

      expect(result).toBe(0);
    });

    test("given: items with missing or empty fields, should: treat them as 0", () => {
      const items: InvoiceItem[] = [
        { description: "Product", quantity: "", unitPrice: "", total: "0" },
      ];

      const result = calculateSubtotal(items);

      expect(result).toBe(0);
    });
  });

  describe("calculateTax", () => {
    test("given: percentage mode, should: calculate tax from subtotal and rate", () => {
      const result = calculateTax(59.99, 8.5, 0, "percentage");

      expect(result.taxAmount).toBeCloseTo(5.1, 1);
      expect(result.taxRate).toBe(8.5);
    });

    test("given: amount mode, should: recalculate rate from amount", () => {
      const result = calculateTax(100, 0, 7.5, "amount");

      expect(result.taxAmount).toBe(7.5);
      expect(result.taxRate).toBe(7.5);
    });
  });

  describe("calculateDiscount", () => {
    test("given: percentage mode, should: calculate discount from subtotal and rate", () => {
      const result = calculateDiscount(100, 10, 0, "percentage");

      expect(result.discount).toBe(10);
      expect(result.discountRate).toBe(10);
    });

    test("given: amount mode, should: recalculate rate from amount", () => {
      const result = calculateDiscount(200, 0, 30, "amount");

      expect(result.discount).toBe(30);
      expect(result.discountRate).toBe(15);
    });
  });

  describe("calculateTotal", () => {
    test("given: subtotal with tax and discount for a receipt, should: return correct total", () => {
      // Subtotal $59.99, Tax $5.10, Discount $5.00
      const result = calculateTotal(59.99, 5.1, 5.0);

      expect(result).toBeCloseTo(60.09, 2);
    });

    test("given: only subtotal (no tax or discount), should: return subtotal", () => {
      const result = calculateTotal(49.99, 0, 0);

      expect(result).toBe(49.99);
    });
  });

  describe("end-to-end receipt calculation flow", () => {
    test("given: receipt items, should: calculate subtotal → tax → discount → total correctly", () => {
      const items: InvoiceItem[] = [
        {
          description: "Widget",
          quantity: "3",
          unitPrice: "10.00",
          total: "30.00",
        },
        {
          description: "Gadget",
          quantity: "1",
          unitPrice: "20.00",
          total: "20.00",
        },
      ];

      const subtotal = calculateSubtotal(items);
      expect(subtotal).toBe(50);

      const tax = calculateTax(subtotal, 10, 0, "percentage");
      expect(tax.taxAmount).toBe(5);

      const discount = calculateDiscount(subtotal, 5, 0, "percentage");
      expect(discount.discount).toBe(2.5);

      const total = calculateTotal(subtotal, tax.taxAmount, discount.discount);
      expect(total).toBe(52.5);
    });
  });
});
