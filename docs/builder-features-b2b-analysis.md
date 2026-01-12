# Builder Features: Use Cases, Growth Potential & B2B/API Opportunities

## Executive Summary

This document outlines the current capabilities, market opportunities, and monetization strategies for the Template Builder feature as a B2B API product. The builder is a visual, drag-and-drop document generation platform supporting multiple document types with extensible architecture.

---

## Current Capabilities

### Template Types

**Currently Implemented:**
- **Resumes** - 8+ section types:
  - Header (name, title, contact info, social links)
  - Experience (work history with rich text descriptions)
  - Education (institutions, degrees, years)
  - Skills (categorized skill lists)
  - Projects (with technologies and links)
  - Certifications (with issuer and verification links)
  - Languages (with proficiency levels)
  - Summary (rich text professional summary)

- **Invoices** - Complete invoicing system:
  - Invoice Header (company info, logo, billing/shipping addresses)
  - Invoice Items (description, quantity, unit price, totals)
  - Invoice Footer (subtotals, tax, discount, payment terms, notes)

**Planned:**
- Certificates
- Report Cards

**Business Operations Document Types (Type System Ready):**
- **Quotes** - Price quotations for services/products:
  - Quote Header (company info, quote number, dates, client info)
  - Quote Items (description, quantity, unit price, totals)
  - Quote Footer (subtotals, tax, discount, validity period, terms)

- **Proposals** - Business proposals and project bids:
  - Proposal Header (company info, proposal number, client info)
  - Proposal Body (sections, pricing, timeline, deliverables)
  - Proposal Footer (terms, acceptance, signature)

- **Contracts** - Legal agreements and contracts:
  - Contract Header (parties, contract number, effective dates)
  - Contract Body (terms, conditions, clauses, obligations)
  - Contract Signature (signature blocks, dates, witnesses)

- **Purchase Orders** - Procurement documents:
  - PO Header (company info, PO number, vendor info, dates)
  - PO Items (description, quantity, unit price, totals)
  - PO Footer (subtotals, shipping, terms, approval)

- **Receipts** - Payment confirmations:
  - Receipt Header (company info, receipt number, date)
  - Receipt Items (description, quantity, price, totals)
  - Receipt Footer (payment method, transaction ID, thank you message)

- **Estimates** - Cost estimates and budgets:
  - Estimate Header (company info, estimate number, client info)
  - Estimate Items (description, quantity, unit price, totals)
  - Estimate Footer (subtotals, tax, discount, validity, notes)

- **Statements** - Account statements and summaries:
  - Statement Header (company info, statement period, account info)
  - Statement Transactions (date, description, amount, balance)
  - Statement Footer (totals, due date, payment instructions)

- **Letters** - Business correspondence:
  - Letter Header (sender info, date, recipient info)
  - Letter Body (content, paragraphs, sections)
  - Letter Footer (closing, signature, enclosures)

- **Forms** - Custom forms and applications:
  - Form Header (title, instructions, form number)
  - Form Fields (text fields, checkboxes, radio buttons, dropdowns)
  - Form Footer (submit button, terms, signature)

- **Labels** - Shipping labels, name tags, etc.:
  - Label Content (address, barcode, tracking number, instructions)

### Core Features

1. **Visual Drag-and-Drop Builder**
   - Intuitive component palette
   - Real-time canvas editing
   - Section reordering via drag-and-drop
   - Inline field editing

2. **Real-Time Preview**
   - Live preview modal
   - HTML generation for preview
   - Responsive design support

3. **PDF Export**
   - Server-side PDF generation (Puppeteer/Playwright)
   - High-quality document output
   - Customizable styling

4. **Template Management**
   - Database persistence (organization-scoped)
   - Predefined template library
   - Custom template creation
   - Template versioning ready

5. **Rich Text Editing**
   - WYSIWYG editor for descriptions
   - HTML content support
   - Formatted text output

6. **Advanced Styling**
   - 120+ CSS properties per section
   - Global template styles
   - Custom fonts, colors, spacing
   - Border, shadow, and effect controls

7. **Multi-Tenant Architecture**
   - Organization-scoped templates
   - User isolation
   - Scalable data model

---

## Use Cases & Market Opportunities

### 1. HR & Recruitment Technology

**Target Customers:**
- Job boards (Indeed, LinkedIn, Glassdoor)
- Career platforms
- Recruitment agencies
- ATS (Applicant Tracking System) providers
- University career centers

**Use Cases:**
- Resume builder for job seekers
- ATS-friendly resume generation
- Bulk resume generation for recruitment agencies
- White-label resume solutions
- Professional profile builders

**Market Size:** HR Tech market is $24B+ and growing

### 2. Business Operations & Invoicing

**Target Customers:**
- SMB invoicing platforms
- Accounting software companies
- Freelancer platforms (Upwork, Fiverr)
- Service-based businesses
- E-commerce platforms

**Use Cases:**
- Automated invoice generation
- Multi-tenant SaaS invoicing
- Accounting software integrations
- Recurring billing systems
- Quote-to-invoice workflows

**Market Size:** Invoice automation market is $2.8B+

### 3. Education Technology

**Target Customers:**
- School management systems
- Online learning platforms (Coursera, Udemy)
- Training companies
- Certification bodies
- Educational institutions

**Use Cases:**
- Report card generation
- Certificate generation for courses/training
- Transcript generation
- Student portfolio builders
- Achievement documentation

**Market Size:** EdTech market is $106B+ globally

### 4. Enterprise Document Automation

**Target Customers:**
- Enterprise SaaS platforms
- Workflow automation tools (Zapier, Make.com)
- CRM systems (Salesforce, HubSpot)
- Legal tech companies
- Government agencies

**Use Cases:**
- Document generation APIs
- White-label document builders
- Workflow automation (generate documents from data)
- Compliance document generation
- Contract generation

**Market Size:** Document generation market is $4.5B+ (growing 15% YoY)

---

## B2B/API Monetization Strategy

### Tier 1: API Access

**Core API Endpoints:**

```
# Template Management
GET    /api/v1/templates
POST   /api/v1/templates
GET    /api/v1/templates/:id
PUT    /api/v1/templates/:id
DELETE /api/v1/templates/:id

# Document Generation
POST   /api/v1/templates/:id/generate
POST   /api/v1/templates/:id/export?format=pdf|docx|html
POST   /api/v1/templates/:id/preview

# Bulk Operations
POST   /api/v1/bulk/generate
POST   /api/v1/bulk/export

# Webhooks
POST   /api/v1/webhooks (register)
GET    /api/v1/webhooks
DELETE /api/v1/webhooks/:id
```

**Pricing Model:**

| Tier | Price | Documents/Month | Features |
|------|-------|-----------------|----------|
| **Free** | $0 | 100 | Basic templates, PDF only |
| **Starter** | $99/month | 1,000 | All templates, multiple formats |
| **Professional** | $299/month | 10,000 | API access, webhooks, priority support |
| **Enterprise** | Custom | Unlimited | SLA, dedicated support, custom templates |

**Additional Revenue Streams:**
- Per-document pricing: $0.10 - $1.00 per document
- Overage charges: $0.05 per document beyond plan limit
- Custom template development: $500 - $5,000 per template
- White-label licensing: $1,000 - $10,000/month

### Tier 2: White-Label Solutions

**Offering:**
- Embeddable builder widget (iframe/React component)
- Custom branding (colors, logos, domain)
- Dedicated infrastructure
- Custom template development
- Co-branded solutions

**Pricing:** $1,000 - $10,000/month based on usage and customization

**Target Customers:**
- Large SaaS platforms
- Enterprise clients
- Resellers and partners

### Tier 3: Enterprise Integrations

**Integration Options:**
- Salesforce integration (AppExchange)
- QuickBooks/Xero integration
- Zapier/Make.com connectors
- Webhook support for automation
- REST API with comprehensive documentation
- SDKs (Node.js, Python, PHP, Ruby)

**Pricing:** $5,000 - $50,000+/year based on:
- Number of users
- API call volume
- Support level required
- Custom integrations

---

## Growth Potential

### Immediate Opportunities (0-6 months)

1. **Complete Core Templates**
   - Finish certificate templates
   - Complete report card templates
   - Add 2-3 more resume templates
   - Add 2-3 more invoice templates

2. **Export Format Expansion**
   - DOCX export (Word documents)
   - HTML export (web-friendly)
   - PNG/JPG export (image format)
   - JSON export (data format)

3. **Template Marketplace**
   - User-generated templates
   - Template sharing between organizations
   - Premium template store
   - Template rating/review system

4. **AI-Powered Features**
   - Content suggestions
   - Auto-completion
   - Grammar and style checking
   - Skill/experience recommendations

### Medium-Term Expansion (6-18 months)

1. **Additional Document Types (Type System Ready):**
   - ✅ **Quotes** - Price quotations (ready for implementation)
   - ✅ **Proposals** - Business proposals (ready for implementation)
   - ✅ **Contracts** - Legal agreements (ready for implementation)
   - ✅ **Purchase Orders** - Procurement documents (ready for implementation)
   - ✅ **Receipts** - Payment confirmations (ready for implementation)
   - ✅ **Estimates** - Cost estimates (ready for implementation)
   - ✅ **Statements** - Account statements (ready for implementation)
   - ✅ **Letters** - Business correspondence (ready for implementation)
   - ✅ **Forms** - Custom forms (ready for implementation)
   - ✅ **Labels** - Shipping labels (ready for implementation)
   - Business cards
   - Timesheets
   - Expense reports
   - Work orders
   - Delivery notes

2. **Advanced Features:**
   - Conditional logic (show/hide sections based on data)
   - Data merging from external APIs
   - Multi-language support (i18n)
   - Version control and history
   - Collaboration features (comments, sharing)
   - Template inheritance and variants

3. **Integration Ecosystem:**
   - Zapier integration
   - Make.com (Integromat) integration
   - n8n integration
   - Microsoft Power Automate
   - Google Apps Script

### Long-Term Vision (18+ months)

1. **Document Automation Platform:**
   - Visual workflow builder
   - Data connectors (CRM, databases, APIs)
   - Approval workflows
   - E-signature integration (DocuSign, HelloSign)
   - Document storage and management
   - Analytics and reporting

2. **Industry-Specific Solutions:**
   - **Legal:** Contract generation, legal forms
   - **Real Estate:** Property forms, lease agreements
   - **Healthcare:** Patient forms, medical documentation
   - **Government:** Official forms, compliance documents
   - **Finance:** Financial statements, reports

3. **Enterprise Features:**
   - SSO/SAML authentication
   - Advanced role-based access control
   - Audit logs and compliance
   - Data residency options
   - Custom SLA agreements

---

## Technical Advantages for B2B

### 1. Modular Architecture
- Easy to add new template types
- Component library pattern allows extensibility
- Type-safe with TypeScript
- Clean separation of concerns

### 2. Scalability
- Organization-scoped data (multi-tenant ready)
- Database-backed persistence
- Server-side rendering for PDFs
- Stateless API design

### 3. Developer Experience
- TypeScript for type safety
- RESTful API design
- Comprehensive error handling
- Well-structured codebase

### 4. Extensibility
- Component registry pattern
- Plugin architecture ready
- Custom component support
- Template inheritance system

### 5. API-Ready Infrastructure
- Existing route structure can be converted to API endpoints
- Authentication middleware in place
- Organization context available
- Error handling patterns established

---

## Recommended API Structure

### Authentication

```typescript
// API Key Authentication
Headers: {
  "Authorization": "Bearer {api_key}",
  "X-Organization-Id": "{organization_id}"
}

// OAuth 2.0 (Future)
Headers: {
  "Authorization": "Bearer {access_token}"
}
```

### Core API Endpoints

#### Template Management

```typescript
// List templates
GET /api/v1/templates
Query params: ?type=resume|invoice|certificate|report-cards
Response: { templates: Template[], total: number }

// Get template
GET /api/v1/templates/:id
Response: Template

// Create template
POST /api/v1/templates
Body: { name, type, sections, globalStyles }
Response: Template

// Update template
PUT /api/v1/templates/:id
Body: { name?, sections?, globalStyles? }
Response: Template

// Delete template
DELETE /api/v1/templates/:id
Response: { success: boolean }
```

#### Document Generation

```typescript
// Generate document from template
POST /api/v1/templates/:id/generate
Body: { 
  data: Record<string, any>, // Data to populate template
  format?: 'pdf' | 'html' | 'docx'
}
Response: { 
  document: string, // Base64 encoded or URL
  format: string,
  size: number
}

// Export template to PDF
POST /api/v1/templates/:id/export
Query params: ?format=pdf|html|docx
Body: { data?: Record<string, any> }
Response: Binary file or download URL

// Preview template
POST /api/v1/templates/:id/preview
Body: { data?: Record<string, any> }
Response: HTML string
```

#### Bulk Operations

```typescript
// Bulk generate documents
POST /api/v1/bulk/generate
Body: {
  templateId: string,
  items: Array<{ data: Record<string, any> }>,
  format?: 'pdf' | 'html' | 'docx'
}
Response: {
  documents: Array<{ id: string, url: string }>,
  total: number
}

// Bulk export
POST /api/v1/bulk/export
Body: {
  templateId: string,
  items: Array<{ data: Record<string, any> }>,
  format: 'pdf' | 'zip'
}
Response: Download URL or ZIP file
```

#### Webhooks

```typescript
// Register webhook
POST /api/v1/webhooks
Body: {
  url: string,
  events: ['document.generated', 'template.updated'],
  secret?: string
}
Response: Webhook

// List webhooks
GET /api/v1/webhooks
Response: Webhook[]

// Delete webhook
DELETE /api/v1/webhooks/:id
Response: { success: boolean }
```

### Response Formats

```typescript
// Success Response
{
  success: true,
  data: T,
  meta?: {
    page?: number,
    limit?: number,
    total?: number
  }
}

// Error Response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### Rate Limiting

- Free tier: 100 requests/hour
- Starter: 1,000 requests/hour
- Professional: 10,000 requests/hour
- Enterprise: Custom limits

---

## Competitive Advantages

### 1. Visual Builder vs. Code-Only Solutions
- **Competitors:** Most document generation APIs require code/JSON
- **Advantage:** Visual drag-and-drop interface reduces learning curve
- **Market Gap:** Few solutions offer both visual builder AND API

### 2. Multi-Format Support
- **Competitors:** Many only support PDF
- **Advantage:** PDF, HTML, DOCX, and more
- **Use Case:** Flexibility for different integration needs

### 3. Extensible Component System
- **Competitors:** Fixed component sets
- **Advantage:** Easy to add custom components
- **Value:** Customers can extend functionality

### 4. Organization-Level Isolation
- **Competitors:** User-level or global templates
- **Advantage:** Enterprise-ready multi-tenancy
- **Security:** Data isolation built-in

### 5. Modern Tech Stack
- **Competitors:** Legacy systems
- **Advantage:** React Router, TypeScript, modern tooling
- **Developer Experience:** Better DX for integrations

---

## Revenue Potential

### Market Segments

| Segment | Monthly Price | Annual Revenue Potential |
|---------|--------------|--------------------------|
| SMB (1,000 customers) | $50-500 | $600K - $6M |
| Mid-Market (100 customers) | $500-5,000 | $600K - $6M |
| Enterprise (10 customers) | $10K-100K | $1.2M - $12M |
| API Usage (1M documents @ $0.50) | Variable | $6M |

### Total Addressable Market (TAM)

- **Document Generation:** $4.5B+ (growing 15% YoY)
- **Invoice Automation:** $2.8B+
- **HR Tech:** $24B+
- **EdTech:** $106B+

**Conservative Estimate:** 0.1% market share = $45M+ annual revenue potential

---

## Next Steps to Maximize B2B Value

### Phase 1: API Foundation (Months 1-3)

1. **API Authentication**
   - Implement API key generation
   - Add API key management UI
   - Create authentication middleware
   - Rate limiting implementation

2. **Core API Endpoints**
   - Template CRUD endpoints
   - Document generation endpoints
   - Export endpoints
   - Error handling and validation

3. **API Documentation**
   - OpenAPI/Swagger specification
   - Interactive API docs (Swagger UI)
   - Code examples (cURL, JavaScript, Python)
   - Postman collection

### Phase 2: Developer Experience (Months 4-6)

1. **SDK Development**
   - Node.js SDK
   - Python SDK
   - PHP SDK
   - Ruby SDK (optional)

2. **Webhook System**
   - Webhook registration
   - Event system
   - Retry logic
   - Webhook management UI

3. **Analytics Dashboard**
   - API usage metrics
   - Error tracking
   - Performance monitoring
   - Billing integration

### Phase 3: Enterprise Features (Months 7-12)

1. **Advanced Features**
   - Bulk operations
   - Template marketplace
   - Custom components API
   - Webhook system

2. **Integrations**
   - Zapier integration
   - Make.com integration
   - Salesforce AppExchange
   - QuickBooks/Xero

3. **Enterprise Support**
   - SSO/SAML
   - Advanced RBAC
   - Audit logs
   - SLA guarantees

### Phase 4: Scale & Optimize (Months 13+)

1. **Performance**
   - Caching layer
   - CDN for document delivery
   - Queue system for bulk operations
   - Database optimization

2. **Additional Formats**
   - DOCX export
   - HTML export
   - Image export (PNG/JPG)

3. **Marketplace**
   - Template marketplace
   - Component marketplace
   - Revenue sharing model

---

## Success Metrics

### Key Performance Indicators (KPIs)

1. **Adoption Metrics**
   - Number of API keys created
   - Active API users (monthly)
   - API calls per user
   - Template creation rate

2. **Revenue Metrics**
   - Monthly Recurring Revenue (MRR)
   - Average Revenue Per User (ARPU)
   - Customer Lifetime Value (LTV)
   - Churn rate

3. **Technical Metrics**
   - API response time (p95, p99)
   - Error rate
   - Uptime/SLA compliance
   - Document generation time

4. **Product Metrics**
   - Templates created
   - Documents generated
   - Most popular template types
   - Feature usage

---

## Conclusion

The Template Builder has strong potential as a B2B API product. The modular architecture, multi-tenant design, and visual builder interface provide significant competitive advantages. With proper API development, documentation, and go-to-market strategy, this can become a profitable SaaS offering.

**Key Strengths:**
- ✅ Solid technical foundation
- ✅ Extensible architecture
- ✅ Multiple use cases
- ✅ Large addressable market
- ✅ Clear monetization path

**Recommended Focus:**
1. Complete core templates (certificates, report cards)
2. Build API layer with authentication
3. Create comprehensive documentation
4. Develop SDKs for popular languages
5. Launch with freemium model
6. Iterate based on customer feedback

---

## How to Add New Document Types

The builder is designed with an extensible architecture that makes adding new document types straightforward. Here's the step-by-step process:

### Step 1: Update Type Definitions

**File:** `app/features/builder/shared/types.ts`

1. Add the new type to `TemplateType`:
```typescript
export type TemplateType =
  | "resume"
  | "invoice"
  // ... existing types
  | "your-new-type";  // Add here
```

2. Add section types for your document:
```typescript
export type SectionType =
  | "header"
  // ... existing sections
  | "your-type-header"
  | "your-type-body"
  | "your-type-footer";  // Add here
```

### Step 2: Update Validation Schemas

Update all Zod validation schemas to include the new type:

**Files to update:**
- `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/builder+/$templateId/_index.tsx`
- `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/builder+/$templateId+/export.tsx`
- `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/builder+/$templateId+/preview.tsx`
- `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/builder+/_index.tsx`

Add to all `z.enum()` calls:
```typescript
type: z.enum([
  "resume",
  "invoice",
  // ... existing types
  "your-new-type",  // Add here
]),
```

### Step 3: Update Prisma Schema

**File:** `prisma/schema.prisma`

Add to the `TemplateType` enum:
```prisma
enum TemplateType {
  resume
  invoice
  // ... existing types
  yourNewType  // Add here (camelCase)
}
```

**Important:** After updating Prisma schema:
1. Run `npx prisma generate` to regenerate types
2. Create and run a migration: `npx prisma migrate dev --name add_your_new_type`

### Step 4: Create Feature Folder Structure

Create a new folder following the existing pattern:
```
app/features/builder/your-new-type/
├── components/
│   └── component-library.ts    # Define available components
├── templates/
│   └── your-type-templates.ts   # Predefined templates
└── utils/
    └── html-generator-your-type.server.ts  # HTML generation logic
```

### Step 5: Create Component Library

**File:** `app/features/builder/your-new-type/components/component-library.ts`

```typescript
import type { ComponentDefinition } from "../../shared/types";

export const yourTypeComponentLibrary: Record<string, ComponentDefinition> = {
  "your-type-header": {
    configurableProperties: ["field1", "field2"],
    defaultData: { field1: "", field2: "" },
    defaultStyles: { padding: "2rem" },
    icon: "FileText",
    label: "Your Type Header",
    type: "your-type-header",
  },
  // Add more components...
};
```

### Step 6: Register Components

**File:** `app/features/builder/shared/components/component-library-registry.ts`

```typescript
import { yourTypeComponentLibrary } from "../../your-new-type/components/component-library";
// ... existing imports

export const componentLibrary: Record<string, ComponentDefinition> = {
  ...resumeComponentLibrary,
  ...invoiceComponentLibrary,
  ...yourTypeComponentLibrary,  // Add here
};
```

### Step 7: Add to Component Palette

**File:** `app/features/builder/shared/components/component-palette.tsx`

Update the `getComponentsForType` function:
```typescript
const getComponentsForType = (type: string | undefined): string[] => {
  // ... existing cases
  case "your-new-type":
    return ["your-type-header", "your-type-body", "your-type-footer"];
  // ...
};
```

### Step 8: Create HTML Generator

**File:** `app/features/builder/your-new-type/utils/html-generator-your-type.server.ts`

Create functions to generate HTML for preview and export:
```typescript
export function generateYourTypePreviewHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
): string {
  // Implementation
}

export function generateYourTypeExportHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
): string {
  // Implementation
}
```

### Step 9: Register HTML Generators

**File:** `app/features/builder/shared/utils/html-generator.server.ts`

Add cases to the switch statements:
```typescript
export function generatePreviewHTML(...) {
  switch (templateType) {
    // ... existing cases
    case "your-new-type":
      return generateYourTypePreviewHTML(sections, globalStyles);
    // ...
  }
}
```

### Step 10: Create Section Renderer

**File:** `app/features/builder/shared/components/section-renderer.tsx`

Add rendering logic for your new section types in the `renderSection()` function:
```typescript
case "your-type-header": {
  // Render logic
  return <div>...</div>;
}
```

### Step 11: Add to Builder Home Page

**File:** `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/builder+/_index.tsx`

1. Add to `builderTypes` array:
```typescript
const builderTypes = [
  // ... existing types
  {
    icon: YourIcon,
    label: "Your Type",
    value: "your-new-type",
  },
];
```

2. Update loader to fetch templates:
```typescript
const dbYourType = await retrieveTemplatesByOrganizationIdAndType({
  organizationId: organization.id,
  type: "your-new-type",
});
```

### Step 12: Create Predefined Templates (Optional)

**File:** `app/features/builder/your-new-type/templates/your-type-templates.ts`

```typescript
import type { Template } from "../../shared/types";

export const yourTypeTemplates: Template[] = [
  {
    id: "your-type-template-1",
    name: "Template Name",
    type: "your-new-type",
    // ... template definition
  },
];
```

Register in `app/features/builder/shared/templates/index.ts`:
```typescript
import { yourTypeTemplates } from "../../your-new-type/templates/your-type-templates";

export const predefinedTemplates: Record<string, Template[]> = {
  // ... existing
  "your-new-type": yourTypeTemplates,
};
```

### Step 13: Update Database Model (if needed)

If your new document type needs custom data structures, you may need to:
1. Add new interfaces to `app/features/builder/shared/types.ts`
2. Update Prisma schema if storing structured data
3. Create migration

### Testing Checklist

- [ ] Type appears in builder sidebar
- [ ] Components show in component palette
- [ ] Can drag and drop components
- [ ] Can edit component data
- [ ] Preview works correctly
- [ ] Export to PDF works
- [ ] Templates can be saved to database
- [ ] Templates can be loaded from database
- [ ] Validation schemas accept new type
- [ ] No TypeScript errors

### Example: Adding a "Quote" Document Type

Following the pattern above, a Quote type would:
1. Use similar structure to Invoice (header, items, footer)
2. Reuse invoice components or create quote-specific ones
3. Have quote-specific fields (validity period, terms)
4. Generate HTML similar to invoices but with quote-specific styling

---

*Last Updated: [Current Date]*
*Document Version: 1.1*

