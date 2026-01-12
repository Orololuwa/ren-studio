# Adding New Document Types - Quick Reference

This is a quick reference guide for adding new document types to the builder. For detailed explanations, see `builder-features-b2b-analysis.md`.

## Current Document Types

**Implemented:**
- ✅ resume
- ✅ invoice

**Planned:**
- ⏳ certificate
- ⏳ report-cards

**Type System Ready (Need Implementation):**
- 📋 quote
- 📋 proposal
- 📋 contract
- 📋 purchase-order
- 📋 receipt
- 📋 estimate
- 📋 statement
- 📋 letter
- 📋 form
- 📋 label

## Quick Steps

1. **Update Types** (`app/features/builder/shared/types.ts`)
   - Add to `TemplateType`
   - Add section types to `SectionType`

2. **Update Validation** (4 files)
   - `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/builder+/$templateId/_index.tsx`
   - `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/builder+/$templateId+/export.tsx`
   - `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/builder+/$templateId+/preview.tsx`
   - `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/builder+/_index.tsx`

3. **Update Prisma Schema** (`prisma/schema.prisma`)
   - Add to `TemplateType` enum
   - Run `npx prisma generate`
   - Create migration: `npx prisma migrate dev --name add_your_type`

4. **Create Feature Folder**
   ```
   app/features/builder/your-type/
   ├── components/component-library.ts
   ├── templates/your-type-templates.ts
   └── utils/html-generator-your-type.server.ts
   ```

5. **Register Components**
   - Add to `component-library-registry.ts`
   - Add to `component-palette.tsx`

6. **Create HTML Generators**
   - Implement preview and export HTML generation
   - Register in `html-generator.server.ts`

7. **Add Section Renderer**
   - Add rendering logic in `section-renderer.tsx`

8. **Update Builder UI**
   - Add to `builderTypes` array
   - Update loader to fetch templates

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

