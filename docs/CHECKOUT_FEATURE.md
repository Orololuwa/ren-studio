# Checkout Feature Documentation

## Overview

The Checkout feature enables organizations to create custom-branded checkout pages for collecting one-time payments online. After successful payment, receipts are automatically generated using pre-selected receipt templates. The feature supports multiple payment providers (Stripe and Paystack) with embedded payment forms, and includes security features like password protection for checkout pages.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Database Schema](#database-schema)
3. [User Flows](#user-flows)
4. [API Design](#api-design)
5. [Payment Integration](#payment-integration)
6. [Security](#security)
7. [UI/UX Specifications](#uiux-specifications)
8. [Implementation Phases](#implementation-phases)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Organization Dashboard                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Checkout Pages Management                      │   │
│  │  - List checkout pages                                │   │
│  │  - Create new checkout page                           │   │
│  │  - Edit checkout page                                 │   │
│  │  - View analytics                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Checkout Page Builder                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Step 1:    │  │   Step 2:    │  │   Step 3:    │    │
│  │  Design      │→ │  Receipt     │→ │  Payment     │    │
│  │  Page        │  │  Template    │  │  Settings    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Public Checkout Page                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Custom Branded Checkout UI                           │   │
│  │  - Header (logo, store name)                          │   │
│  │  - Items list                                         │   │
│  │  - Embedded Stripe/Paystack Elements                 │   │
│  │  - Footer (terms, policies)                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Payment Processing                             │
│  ┌──────────────┐              ┌──────────────┐           │
│  │   Stripe     │              │   Paystack   │           │
│  │   Elements   │              │   Elements   │           │
│  └──────────────┘              └──────────────┘           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Webhook Handlers                               │
│  - payment_intent.succeeded (Stripe)                        │
│  - charge.success (Paystack)                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Auto-Receipt Generation                        │
│  - Generate receipt from template                           │
│  - Populate with payment data                               │
│  - Store in database                                        │
│  - Send to customer email                                   │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Checkout Page Builder**: Visual editor for creating branded checkout pages
2. **Checkout Page Storage**: Database models for checkout pages and their configurations
3. **Public Checkout Routes**: Public-facing routes for customers to complete payments
4. **Payment Providers**: Stripe and Paystack integration with embedded Elements
5. **Receipt Generation**: Automatic receipt creation using selected receipt templates
6. **Webhook Handlers**: Server-side handlers for payment confirmation events

---

## Database Schema

### CheckoutPage Model

```prisma
model CheckoutPage {
  id                    String   @id @default(cuid(2))
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Organization relationship
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Basic info
  name                  String   // Internal name for organization
  slug                  String   @unique // URL-friendly identifier for public access
  description           String?  // Optional description
  
  // Checkout page design (stored as JSON, similar to Template sections)
  sections              Json     // Array of checkout sections (header, items, payment, footer)
  globalStyles          Json     // Global styling configuration
  colorPalette          String[] // Color scheme for checkout page
  
  // Receipt template assignment
  receiptTemplateId     String?  // ID of receipt template to use for auto-generation
  receiptTemplate       Template? @relation("CheckoutReceiptTemplate", fields: [receiptTemplateId], references: [id])
  
  // Payment settings
  paymentProviders     String[] // Array of enabled providers: ["stripe", "paystack"]
  defaultCurrency      String   @default("USD")
  allowedCurrencies    String[] // Array of allowed currencies: ["USD", "NGN", "EUR"]
  
  // Security
  isPasswordProtected  Boolean  @default(false)
  passwordHash         String?  // Hashed password if protected
  passwordHint         String?  // Optional hint for password
  
  // Access control
  isActive             Boolean  @default(true)
  expiresAt             DateTime? // Optional expiration date
  
  // Analytics
  viewCount             Int      @default(0)
  paymentCount          Int      @default(0)
  totalRevenue           Decimal  @default(0) @db.Decimal(10, 2)
  
  // Relations
  payments              Payment[]
  
  @@index([organizationId])
  @@index([slug])
  @@index([isActive])
}
```

### Payment Model

```prisma
model Payment {
  id                    String   @id @default(cuid(2))
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Checkout page relationship
  checkoutPageId        String
  checkoutPage          CheckoutPage @relation(fields: [checkoutPageId], references: [id], onDelete: Cascade)
  
  // Payment provider info
  provider              String   // "stripe" or "paystack"
  providerPaymentId     String   // Payment ID from provider (e.g., Stripe payment_intent ID)
  providerCustomerId    String?  // Customer ID from provider
  
  // Payment details
  amount                Decimal  @db.Decimal(10, 2)
  currency              String
  status                PaymentStatus
  
  // Customer information
  customerEmail         String
  customerName          String?
  customerPhone         String?
  billingAddress        Json?    // Structured billing address
  
  // Payment items (what was purchased)
  items                 Json     // Array of items with description, quantity, price
  
  // Receipt
  receiptId             String? @unique
  receipt                Receipt? @relation(fields: [receiptId], references: [id])
  
  // Metadata
  metadata              Json?    // Additional metadata from payment provider
  
  @@index([checkoutPageId])
  @@index([providerPaymentId])
  @@index([status])
  @@index([customerEmail])
}

enum PaymentStatus {
  pending
  processing
  succeeded
  failed
  canceled
  refunded
  partially_refunded
}
```

### Receipt Model (Extension)

```prisma
model Receipt {
  id                    String   @id @default(cuid(2))
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Template relationship
  templateId            String
  template              Template @relation(fields: [templateId], references: [id])
  
  // Payment relationship
  paymentId             String   @unique
  payment               Payment  @relation(fields: [paymentId], references: [id])
  
  // Receipt data (populated from payment + template)
  sections              Json     // Receipt sections with payment data merged
  globalStyles          Json
  colorPalette          String[]
  
  // Receipt metadata
  receiptNumber         String   @unique
  issuedAt              DateTime @default(now())
  
  // Delivery
  sentToEmail           String?
  sentAt                DateTime?
  
  @@index([paymentId])
  @@index([receiptNumber])
}
```

### Template Model Extension

```prisma
model Template {
  // ... existing fields ...
  
  // New relation for checkout pages
  checkoutPagesUsingAsReceipt CheckoutPage[] @relation("CheckoutReceiptTemplate")
  
  // New relation for generated receipts
  generatedReceipts     Receipt[]
}
```

---

## User Flows

### Flow 1: Creating a Checkout Page

```
1. Organization user navigates to Checkout Pages section
   └─> /organizations/:organizationSlug/checkout-pages

2. User clicks "Create New Checkout Page"
   └─> Opens checkout page builder

3. Step 1: Design Checkout Page
   ├─> Visual builder (similar to template builder)
   ├─> Sections: Header, Items, Payment Form, Footer
   ├─> Customize branding (logo, colors, fonts)
   └─> Preview in real-time

4. Step 2: Assign Receipt Template
   ├─> Select from existing receipt templates
   ├─> Preview how receipt will look
   └─> Confirm selection

5. Step 3: Payment Settings
   ├─> Enable payment providers (Stripe, Paystack)
   ├─> Configure currencies
   ├─> Set default currency
   └─> Configure payment form options

6. Step 4: Security Settings
   ├─> Optional: Enable password protection
   ├─> Set password (if enabled)
   ├─> Optional: Set password hint
   └─> Optional: Set expiration date

7. Save Checkout Page
   ├─> Generate unique slug
   ├─> Create database record
   └─> Return to checkout pages list
```

### Flow 2: Customer Payment Flow

```
1. Customer receives checkout link
   └─> /checkout/:checkoutPageSlug

2. If password protected:
   ├─> Show password entry form
   ├─> Validate password
   └─> On success, show checkout page

3. Customer views checkout page
   ├─> See branded header with logo/store name
   ├─> See items list with prices
   ├─> See payment form (Stripe/Paystack Elements)
   └─> See footer with terms/policies

4. Customer enters payment details
   ├─> Fill in payment form (card details)
   ├─> Enter billing information
   └─> Review total amount

5. Customer submits payment
   ├─> Payment provider processes payment
   ├─> Show loading state
   └─> Wait for confirmation

6. Payment Success
   ├─> Show success message
   ├─> Trigger webhook handler
   ├─> Auto-generate receipt
   ├─> Send receipt to customer email
   └─> Redirect to success page with receipt link

7. Payment Failure
   ├─> Show error message
   ├─> Allow retry
   └─> Display error details
```

### Flow 3: Auto-Receipt Generation

```
1. Payment webhook received
   ├─> payment_intent.succeeded (Stripe)
   └─> charge.success (Paystack)

2. Webhook handler processes event
   ├─> Find Payment record by providerPaymentId
   ├─> Load CheckoutPage
   └─> Load assigned Receipt Template

3. Generate receipt data
   ├─> Merge payment data into receipt template
   ├─> Populate receipt sections:
   │   ├─> Header: Store info from checkout page
   │   ├─> Items: Payment items
   │   ├─> Footer: Payment method, transaction ID, totals
   └─> Generate unique receipt number

4. Create Receipt record
   ├─> Save to database
   ├─> Link to Payment
   └─> Update Payment.receiptId

5. Send receipt to customer
   ├─> Generate PDF from receipt
   ├─> Send email with PDF attachment
   └─> Include receipt link in email

6. Update analytics
   ├─> Increment CheckoutPage.paymentCount
   ├─> Add to CheckoutPage.totalRevenue
   └─> Update Payment.status to "succeeded"
```

---

## API Design

### Checkout Pages Management API

#### List Checkout Pages

```
GET /organizations/:organizationSlug/checkout-pages
Authorization: Required (Organization member)

Response:
{
  "checkoutPages": [
    {
      "id": "checkout_123",
      "name": "Product Launch Checkout",
      "slug": "product-launch-2024",
      "isActive": true,
      "paymentCount": 45,
      "totalRevenue": "12500.00",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### Create Checkout Page

```
POST /organizations/:organizationSlug/checkout-pages
Authorization: Required (Organization member)

Request Body:
{
  "name": "Product Launch Checkout",
  "sections": [...], // Checkout page sections
  "globalStyles": {...},
  "colorPalette": ["#ffffff", "#000000"],
  "receiptTemplateId": "receipt-template-123",
  "paymentProviders": ["stripe", "paystack"],
  "defaultCurrency": "USD",
  "allowedCurrencies": ["USD", "NGN"],
  "isPasswordProtected": true,
  "password": "secure-password",
  "passwordHint": "Company name"
}

Response:
{
  "checkoutPage": {
    "id": "checkout_123",
    "slug": "product-launch-2024",
    "publicUrl": "https://app.example.com/checkout/product-launch-2024",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Get Checkout Page (for editing)

```
GET /organizations/:organizationSlug/checkout-pages/:checkoutPageId
Authorization: Required (Organization member)

Response:
{
  "checkoutPage": {
    "id": "checkout_123",
    "name": "Product Launch Checkout",
    "sections": [...],
    "globalStyles": {...},
    "colorPalette": [...],
    "receiptTemplateId": "receipt-template-123",
    "paymentProviders": ["stripe", "paystack"],
    "isPasswordProtected": true,
    // ... full checkout page data
  }
}
```

#### Update Checkout Page

```
PUT /organizations/:organizationSlug/checkout-pages/:checkoutPageId
Authorization: Required (Organization member)

Request Body:
{
  "name": "Updated Name",
  "sections": [...],
  // ... any fields to update
}

Response:
{
  "checkoutPage": {
    // Updated checkout page
  }
}
```

#### Delete Checkout Page

```
DELETE /organizations/:organizationSlug/checkout-pages/:checkoutPageId
Authorization: Required (Organization member)

Response:
{
  "success": true
}
```

### Public Checkout API

#### Get Public Checkout Page

```
GET /checkout/:checkoutPageSlug
Authorization: None (Public)

Response:
{
  "checkoutPage": {
    "id": "checkout_123",
    "sections": [...], // Public sections only (no sensitive data)
    "globalStyles": {...},
    "colorPalette": [...],
    "paymentProviders": ["stripe", "paystack"],
    "defaultCurrency": "USD",
    "allowedCurrencies": ["USD", "NGN"],
    "isPasswordProtected": true
  }
}
```

#### Verify Password (if protected)

```
POST /checkout/:checkoutPageSlug/verify-password
Authorization: None (Public)

Request Body:
{
  "password": "user-entered-password"
}

Response:
{
  "valid": true,
  "token": "session-token-for-access" // JWT token valid for session
}
```

#### Create Payment Intent (Stripe)

```
POST /checkout/:checkoutPageSlug/payment-intent
Authorization: None (Public, but rate-limited)

Request Body:
{
  "provider": "stripe",
  "amount": 10000, // in cents
  "currency": "USD",
  "items": [
    {
      "description": "Product A",
      "quantity": 2,
      "unitPrice": 5000
    }
  ],
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "billingAddress": {...}
}

Response:
{
  "clientSecret": "pi_xxx_secret_xxx", // Stripe client secret
  "paymentIntentId": "pi_xxx"
}
```

#### Create Payment (Paystack)

```
POST /checkout/:checkoutPageSlug/payment
Authorization: None (Public, but rate-limited)

Request Body:
{
  "provider": "paystack",
  "amount": 10000, // in kobo (smallest currency unit)
  "currency": "NGN",
  "items": [...],
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "billingAddress": {...}
}

Response:
{
  "authorizationUrl": "https://paystack.com/pay/xxx",
  "reference": "paystack-reference-xxx"
}
```

### Webhook Endpoints

#### Stripe Webhook

```
POST /api/v1/stripe/webhooks/checkout
Authorization: Stripe signature verification

Handles:
- payment_intent.succeeded
- payment_intent.payment_failed
- payment_intent.canceled
```

#### Paystack Webhook

```
POST /api/v1/paystack/webhooks/checkout
Authorization: Paystack signature verification

Handles:
- charge.success
- charge.failed
```

### Receipt API

#### Get Receipt

```
GET /receipts/:receiptId
Authorization: None (Public, but receipt should be accessible via link)

Response:
{
  "receipt": {
    "id": "receipt_123",
    "receiptNumber": "RCP-2024-001",
    "sections": [...],
    "issuedAt": "2024-01-15T10:30:00Z",
    "payment": {
      "amount": "100.00",
      "currency": "USD",
      "status": "succeeded"
    }
  }
}
```

#### Download Receipt PDF

```
GET /receipts/:receiptId/pdf
Authorization: None (Public)

Response: PDF file
```

---

## Payment Integration

### Stripe Integration

#### Setup

1. **Stripe Account Configuration**
   - Store Stripe publishable key and secret key per organization
   - Or use global Stripe account with organization metadata

2. **Stripe Elements Integration**
   - Use `@stripe/stripe-js` and `@stripe/react-stripe-js`
   - Embed Payment Element in checkout page
   - Support card payments, Apple Pay, Google Pay

#### Payment Flow

```typescript
// 1. Create Payment Intent on server
const paymentIntent = await stripe.paymentIntents.create({
  amount: amountInCents,
  currency: currency.toLowerCase(),
  metadata: {
    checkoutPageId: checkoutPage.id,
    organizationId: checkoutPage.organizationId,
    customerEmail: customerEmail,
  },
  automatic_payment_methods: {
    enabled: true,
  },
});

// 2. Return client secret to frontend
return { clientSecret: paymentIntent.client_secret };

// 3. Frontend: Confirm payment with Stripe Elements
const { error, paymentIntent: confirmedPayment } = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: `${baseUrl}/checkout/${slug}/success`,
  },
});
```

#### Webhook Handler

```typescript
// Handle payment_intent.succeeded
if (event.type === 'payment_intent.succeeded') {
  const paymentIntent = event.data.object;
  
  // Find or create Payment record
  const payment = await findOrCreatePaymentFromStripePaymentIntent(paymentIntent);
  
  // Generate receipt
  await generateReceiptFromPayment(payment);
  
  // Send receipt email
  await sendReceiptEmail(payment);
}
```

### Paystack Integration

#### Setup

1. **Paystack Account Configuration**
   - Store Paystack public key and secret key per organization
   - Or use global Paystack account

2. **Paystack Elements Integration**
   - Use Paystack Inline JS SDK
   - Embed payment form in checkout page
   - Support card payments, bank transfers

#### Payment Flow

```typescript
// 1. Initialize Paystack payment on server
const response = await paystack.transaction.initialize({
  email: customerEmail,
  amount: amountInKobo,
  currency: currency,
  reference: generateReference(),
  metadata: {
    checkoutPageId: checkoutPage.id,
    organizationId: checkoutPage.organizationId,
    items: JSON.stringify(items),
  },
});

// 2. Return authorization URL to frontend
return { authorizationUrl: response.data.authorization_url, reference: response.data.reference };

// 3. Frontend: Redirect to Paystack or use Paystack Inline
// Option A: Redirect
window.location.href = authorizationUrl;

// Option B: Paystack Inline (embedded)
const handler = PaystackPop.setup({
  key: paystackPublicKey,
  email: customerEmail,
  amount: amountInKobo,
  currency: currency,
  ref: reference,
  callback: function(response) {
    // Handle success
  },
});
handler.openIframe();
```

#### Webhook Handler

```typescript
// Handle charge.success
if (event.event === 'charge.success') {
  const charge = event.data;
  
  // Verify transaction with Paystack
  const transaction = await paystack.transaction.verify(charge.reference);
  
  // Find or create Payment record
  const payment = await findOrCreatePaymentFromPaystackCharge(transaction);
  
  // Generate receipt
  await generateReceiptFromPayment(payment);
  
  // Send receipt email
  await sendReceiptEmail(payment);
}
```

### Payment Provider Configuration

Organizations should be able to configure:
- Stripe publishable key / secret key
- Paystack public key / secret key
- Default payment provider preference
- Currency conversion settings (if applicable)

---

## Security

### Password Protection

1. **Password Hashing**
   - Use bcrypt or Argon2 for password hashing
   - Store hashed password in `CheckoutPage.passwordHash`
   - Never return password hash in API responses

2. **Password Verification Flow**
   ```
   Customer enters password
   → Hash password with same algorithm
   → Compare with stored hash
   → If valid, issue JWT session token
   → Token valid for checkout session (e.g., 1 hour)
   ```

3. **Session Management**
   - JWT token stored in httpOnly cookie or localStorage
   - Token includes checkoutPageId and expiration
   - Validate token on each checkout page request

### Rate Limiting

1. **Public Endpoints**
   - Rate limit payment intent creation: 10 requests per minute per IP
   - Rate limit password verification: 5 attempts per minute per IP
   - Use Redis or in-memory store for rate limiting

2. **Webhook Endpoints**
   - Verify webhook signatures (Stripe, Paystack)
   - Idempotency: Handle duplicate webhook events
   - Rate limit webhook processing

### Data Protection

1. **Sensitive Data**
   - Never log full payment card details
   - Encrypt sensitive metadata in database
   - PCI DSS compliance considerations

2. **Access Control**
   - Checkout pages scoped to organization
   - Only organization members can create/edit checkout pages
   - Public checkout pages are read-only for customers

### CSRF Protection

- Use CSRF tokens for state-changing operations
- Validate origin headers for payment intents
- Implement SameSite cookie attributes

---

## UI/UX Specifications

### Checkout Page Builder

#### Step 1: Design Page

**Layout:**
- Similar to template builder interface
- Left sidebar: Component palette
- Center: Canvas with live preview
- Right sidebar: Properties panel

**Available Components:**
1. **Checkout Header**
   - Logo upload
   - Store name
   - Store address
   - Contact information
   - Customizable styling

2. **Checkout Items**
   - Dynamic items list
   - Item description
   - Quantity
   - Unit price
   - Total calculation
   - Add/remove items
   - Customizable table styling

3. **Payment Form**
   - Provider selection (Stripe/Paystack toggle)
   - Currency selector
   - Billing information fields
   - Terms and conditions checkbox
   - Customizable form styling

4. **Checkout Footer**
   - Terms of service link
   - Privacy policy link
   - Refund policy
   - Contact information
   - Customizable styling

**Features:**
- Drag and drop section reordering
- Real-time preview
- Color palette editor
- Responsive design preview
- Mobile/desktop view toggle

#### Step 2: Assign Receipt Template

**Layout:**
- Grid/list view of available receipt templates
- Preview each template
- Search/filter templates
- Select template with radio button or click

**Features:**
- Template preview with sample data
- Template details (name, description)
- "Use this template" button
- Back to edit template option

#### Step 3: Payment Settings

**Layout:**
- Form with payment configuration options

**Fields:**
- Payment Providers (checkboxes)
  - [ ] Stripe
  - [ ] Paystack
- Default Currency (dropdown)
- Allowed Currencies (multi-select)
- Payment Form Options
  - [ ] Require billing address
  - [ ] Require phone number
  - [ ] Show tax calculation
  - [ ] Allow discount codes

#### Step 4: Security Settings

**Layout:**
- Form with security options

**Fields:**
- Password Protection (toggle)
  - Password (if enabled)
  - Confirm Password
  - Password Hint (optional)
- Expiration (optional)
  - [ ] Set expiration date
  - Expiration Date (date picker)

**Save Button:**
- Creates checkout page
- Generates unique slug
- Shows success message with shareable link

### Public Checkout Page

#### Password Protection Screen (if enabled)

**Layout:**
- Centered modal or full-page form
- Branded with checkout page colors

**Fields:**
- Password input
- Password hint (if provided)
- "Access Checkout" button
- "Forgot password?" link (if applicable)

#### Checkout Page

**Layout:**
- Responsive design
- Mobile-optimized
- Branded with organization colors/logo

**Sections:**
1. **Header**
   - Organization logo
   - Store name
   - Contact info

2. **Items Summary**
   - Table of items
   - Subtotal
   - Tax (if applicable)
   - Discount (if applicable)
   - Total

3. **Payment Form**
   - Stripe Elements or Paystack Inline
   - Billing information
   - Terms checkbox
   - "Pay Now" button

4. **Footer**
   - Terms links
   - Privacy policy
   - Contact info

**States:**
- Loading: Show spinner during payment processing
- Success: Redirect to success page with receipt
- Error: Show error message, allow retry

### Checkout Pages Management

#### List View

**Layout:**
- Table or card grid
- Filters and search

**Columns/Fields:**
- Name
- Slug/URL
- Status (Active/Inactive)
- Payment Count
- Total Revenue
- Created Date
- Actions (Edit, View, Delete, Copy Link)

**Actions:**
- Create New Checkout Page
- Edit existing
- Duplicate
- Delete
- Toggle Active/Inactive
- View Analytics
- Copy Shareable Link

#### Analytics View

**Metrics:**
- Total views
- Total payments
- Conversion rate
- Total revenue
- Average payment amount
- Payment status breakdown
- Revenue over time (chart)

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Database:**
- [ ] Create Prisma schema for CheckoutPage, Payment, Receipt models
- [ ] Run migrations
- [ ] Update Template model with new relations

**API:**
- [ ] Create checkout pages management routes
- [ ] Implement CRUD operations for checkout pages
- [ ] Add authentication/authorization middleware

### Phase 2: Builder UI (Weeks 3-4)

**Checkout Page Builder:**
- [ ] Create builder route and layout
- [ ] Implement component palette for checkout sections
- [ ] Build canvas with drag-and-drop
- [ ] Create properties panel for section editing
- [ ] Add real-time preview
- [ ] Implement step 1: Design Page

**Receipt Template Selection:**
- [ ] Build receipt template selector UI
- [ ] Add template preview
- [ ] Implement step 2: Assign Receipt Template

**Payment & Security Settings:**
- [ ] Create payment settings form
- [ ] Build security settings form
- [ ] Implement steps 3 & 4

### Phase 3: Public Checkout (Weeks 5-6)

**Public Routes:**
- [ ] Create public checkout page route
- [ ] Implement password protection flow
- [ ] Build checkout page renderer
- [ ] Add responsive styling

**Payment Integration:**
- [ ] Integrate Stripe Elements
- [ ] Integrate Paystack Inline
- [ ] Create payment intent/transaction endpoints
- [ ] Implement payment confirmation flow

### Phase 4: Auto-Receipt Generation (Week 7)

**Webhook Handlers:**
- [ ] Create Stripe webhook handler for checkout payments
- [ ] Create Paystack webhook handler
- [ ] Implement receipt generation logic
- [ ] Add receipt email sending

**Receipt Management:**
- [ ] Create receipt storage
- [ ] Build receipt viewing/downloading
- [ ] Add receipt PDF generation

### Phase 5: Management & Analytics (Week 8)

**Management UI:**
- [ ] Build checkout pages list view
- [ ] Add edit/delete functionality
- [ ] Implement analytics dashboard
- [ ] Add shareable link generation

**Testing & Polish:**
- [ ] End-to-end testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation updates

---

## Additional Considerations

### Multi-Currency Support

- Store amounts in smallest currency unit (cents, kobo)
- Display formatted currency based on locale
- Handle currency conversion if needed
- Support currency-specific payment providers

### Email Notifications

- Receipt email to customer
- Payment confirmation to organization
- Failed payment notifications
- Refund notifications

### Analytics & Reporting

- Track checkout page views
- Monitor conversion rates
- Revenue reporting
- Payment method analytics
- Geographic analytics (if available)

### Future Enhancements

- Discount codes/coupons
- Recurring payments support
- Multi-step checkout
- A/B testing for checkout pages
- Custom domain support
- White-label checkout pages

---

## Appendix

### Checkout Section Types

```typescript
type CheckoutSectionType =
  | "checkout-header"
  | "checkout-items"
  | "checkout-payment-form"
  | "checkout-footer";
```

### Payment Provider Configuration

Organizations should store payment provider credentials securely:
- Stripe: Publishable key, Secret key
- Paystack: Public key, Secret key

Consider using environment variables or encrypted storage for sensitive keys.

### Receipt Generation Algorithm

```typescript
async function generateReceiptFromPayment(payment: Payment) {
  // 1. Load checkout page
  const checkoutPage = await getCheckoutPage(payment.checkoutPageId);
  
  // 2. Load receipt template
  const receiptTemplate = await getTemplate(checkoutPage.receiptTemplateId);
  
  // 3. Merge payment data into template
  const receiptSections = receiptTemplate.sections.map(section => {
    switch (section.type) {
      case "receipt-header":
        return {
          ...section,
          data: {
            ...section.data,
            storeName: checkoutPage.sections.find(s => s.type === "checkout-header").data.storeName,
            receiptNumber: generateReceiptNumber(),
            receiptDate: new Date().toLocaleDateString(),
            transactionId: payment.providerPaymentId,
          },
        };
      case "receipt-items":
        return {
          ...section,
          data: {
            ...section.data,
            items: payment.items,
          },
        };
      case "receipt-footer":
        return {
          ...section,
          data: {
            ...section.data,
            subtotal: calculateSubtotal(payment.items),
            taxAmount: calculateTax(payment.items),
            total: payment.amount,
            paymentMethod: payment.provider,
            transactionId: payment.providerPaymentId,
          },
        };
      default:
        return section;
    }
  });
  
  // 4. Create receipt
  const receipt = await createReceipt({
    templateId: receiptTemplate.id,
    paymentId: payment.id,
    sections: receiptSections,
    receiptNumber: generateReceiptNumber(),
  });
  
  // 5. Update payment with receipt ID
  await updatePayment(payment.id, { receiptId: receipt.id });
  
  return receipt;
}
```

---

*Last Updated: [Current Date]*
*Document Version: 1.0*
