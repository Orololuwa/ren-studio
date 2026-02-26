# Adding New Document Types - Quick Reference

This is a quick reference guide for adding new document types to the builder. For detailed explanations, see `builder-features-b2b-analysis.md`.

## Current Document Types

**Implemented end-to-end (UI + preview/export):**
- ✅ resume
- ✅ invoice
- ✅ receipt
- ✅ quote
- ✅ estimate
- ✅ purchase-order
- ✅ sales-order
- ✅ order-confirmation
- ✅ packing-slip
- ✅ contract

**In Type System + Prisma (need wiring + implementation):**
- 📋 certificate
- 📋 report-cards
- 📋 proposal
- 📋 statement
- 📋 letter
- 📋 form
- 📋 label

## Quick Steps

1. **Update Types** (`app/features/templates/shared/types.ts`)
   - Add to `TemplateType`
   - Add section types to `SectionType`

2. **Update Validation / Allowed Types** (3 files)
   - `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/templates+/$templateId/_index.tsx` (save schema)
   - `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/templates+/preview.tsx` (form-data preview schema)
   - `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/templates+/_index.tsx` (`VALID_BUILDER_TYPES`, and the UI tabs if the type should show up)

3. **Update Prisma Schema** (`prisma/schema.prisma`)
   - Add to `TemplateType` enum
   - Run `npx prisma generate`
   - Create migration: `npx prisma migrate dev --name add_your_type`

4. **Create Feature Folder**
   ```
   app/features/templates/your-type/
   ├── components/component-library.ts
   ├── templates/your-type-templates.ts
   └── utils/html-generator-your-type.server.ts
   ```

5. **Register Components**
   - Add to `app/features/templates/shared/components/component-library-registry.ts`
   - Add to `app/features/templates/shared/components/component-palette.tsx`

6. **Create HTML Generators**
   - Implement preview and export HTML generation
   - Register in `app/features/templates/shared/utils/html-generator.server.ts`

7. **Add Section Renderer**
   - Add rendering logic in `app/features/templates/shared/components/section-renderer.tsx`

8. **Update Templates UI (if you want it selectable in the app)**
   - Add to `builderTypes` array in `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/templates+/_index.tsx`
   - Update loader/template modal data in the same file (e.g. `allDefaultTemplates` and/or type tabs)

## Important Notes

⚠️ **Prisma Schema Update Required**

After adding new types to the TypeScript types, you must also update the Prisma schema:

```prisma
enum TemplateType {
  resume
  invoice
  certificate
  reportCards
  quote          // Add new types here
  proposal
  contract
  purchaseOrder  // Use camelCase in Prisma
  receipt
  estimate
  statement
  letter
  form
  label
}
```

**Migration Steps:**
1. Update `prisma/schema.prisma`
2. Run `npx prisma generate`
3. Create migration: `npx prisma migrate dev --name add_business_document_types`
4. Apply migration to database

## Type Naming Convention

- **TypeScript/URL:** Use kebab-case (`purchase-order`)
- **Prisma Enum:** Use camelCase (`purchaseOrder`)
- **Section Types:** Use kebab-case with type prefix (`purchase-order-header`)

**Notable mappings used in this repo:**
- `report-cards` (TS/URL) → `reportCards` (Prisma)
- `purchase-order` (TS/URL) → `purchaseOrder` (Prisma)

## Recommended Next Document Types (Everyday Business)

These are commonly used across industries (services, retail, manufacturing, logistics, construction, agencies) and map well to the existing invoice/receipt architecture (header/items/footer, totals, rich text terms/notes).

**High priority (already in `TemplateType`, not yet implemented end-to-end):**
- 📌 statement
- 📌 proposal

**New recommended types to add next (not currently in `TemplateType`):**
- 📌 credit-note (and debit-note): adjustments/refunds/overcharges
- ~~📌 sales-order~~ (implemented)
- ~~📌 order-confirmation~~ (implemented): seller confirmation sent to customer
- ~~📌 packing-slip~~ (implemented): shipments/fulfillment packing list
- 📌 delivery-note: proof of delivery / goods delivered note
- 📌 proforma-invoice: pre-invoice for customs/advance payment
- 📌 remittance-advice: payment details sent with bank transfers
- 📌 work-order: service/job instruction sheet (often with line items)
- 📌 timesheet: billable hours tracking (great fit for agencies/contractors)
- 📌 expense-report: employee reimbursement

---

## Workflow Flows vs Document Types (Gap Analysis)

Based on the workflow templates in `WORKFLOW_FEATURE.md` and the document types above:

**Document types required by workflow flows:**

| Flow | Documents in flow |
|------|-------------------|
| Retail / E-commerce | Order Confirmation, Shipment*, Invoice, Receipt |
| B2B Wholesale | Quote, Purchase Order, Order Confirmation, Delivery*, Invoice, Receipt |
| Project / Services | Estimate, Quote, Contract, Invoice, Receipt |
| SaaS Subscription | Invoice, Receipt |
| Enterprise SaaS | Quote, Contract, Purchase Order, Order Confirmation, Invoice, Receipt |
| Marketplace | Order Confirmation, Invoice, Receipt (+ Sales Order for “order”) |
| Manufacturing | RFQ*, Quote, Purchase Order, Order Confirmation, Invoice, Receipt |

\*Shipment/Delivery = packing-slip and/or delivery-note. RFQ = request-for-quote (could be a quote subtype or separate type.)

**Already implemented (no gap):**  
Invoice, Receipt, Quote, Estimate, Purchase Order, Sales Order.

**Left to implement for workflow flows:**

| Document type | In TypeScript / Prisma? | Used in flows | Priority for workflows |
|---------------|-------------------------|---------------|-------------------------|
| ~~**order-confirmation**~~ | Yes (implemented) | Retail, B2B, Enterprise, Marketplace, Manufacturing (5) | Done |
| ~~**contract**~~ | Yes (implemented) | Project/Services, Enterprise (2) | Done |
| ~~**packing-slip**~~ | Yes (implemented) | Retail, B2B, Marketplace (shipment/delivery) | Done |
| **delivery-note** | No | B2B, Marketplace (delivery proof) | Medium |
| **RFQ** (request-for-quote) | No | Manufacturing (1) | Low (or treat as quote variant) |

**Summary:** To support the documented workflow templates end-to-end, the main gap remaining is **delivery-note**. Order-confirmation, contract, and packing-slip are now implemented. Packing-slip covers shipment lists; delivery-note would cover proof-of-delivery. RFQ can be a separate type or a quote subtype (e.g. “Request for Quote” template).

---

## Testing

After adding a new type, verify:
- [ ] Type appears in sidebar
- [ ] Components show in palette
- [ ] Drag & drop works
- [ ] Preview renders correctly
- [ ] PDF export works
- [ ] Save/load from database works
- [ ] No TypeScript errors
- [ ] No runtime errors

