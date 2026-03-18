import { init } from "@paralleldrive/cuid2";
import bcrypt from "bcryptjs";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import * as React from "react";
import {
  data,
  href,
  redirect,
  useActionData,
  useFetcher,
  useNavigate,
} from "react-router";
import { z } from "zod";

import type { Route } from "./+types/_index";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
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
import { createCheckoutPageToDatabase } from "~/features/checkout/checkout-pages-model.server";
import type { CheckoutLineItem } from "~/features/checkout/checkout-sections";
import { CheckoutPageRenderer } from "~/features/checkout/components/checkout-page-renderer";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import {
  getTemplateById,
  getTemplatesByType,
} from "~/features/templates/shared/templates";
import {
  retrieveTemplateFromDatabaseById,
  retrieveTemplatesByOrganizationIdAndType,
} from "~/features/templates/shared/templates-model.server";
import type { TemplateSection } from "~/features/templates/shared/types";
import type { Prisma } from "~/generated/client";
import { getErrorMessage } from "~/utils/get-error-message";
import { slugify } from "~/utils/slugify.server";

const cuid = init({ length: 6 });

const createSchema = z.object({
  intent: z.literal("create"),
  name: z.string().min(1),
  slug: z.string().optional().default(""),
  description: z.string().optional().default(""),
  headerLogoUrl: z.string().optional().default(""),
  headerBackgroundColor: z.string().optional().default(""),
  headerTextColor: z.string().optional().default(""),
  layout: z
    .enum(["centered-card", "split", "minimal"])
    .optional()
    .default("centered-card"),
  itemsSource: z.enum(["manual", "invoice-template"]).default("manual"),
  invoiceTemplateId: z.string().optional().default(""),
  itemsJson: z.string().optional().default("[]"),
  receiptTemplateId: z.string().optional().default(""),
  paymentProviders: z
    .union([z.array(z.string()), z.string()])
    .transform((val) =>
      typeof val === "string" ? val.split(",").filter(Boolean) : val,
    )
    .refine((arr) => arr.includes("stripe") || arr.includes("paystack"), {
      message: "Select at least one payment provider",
    }),
  defaultCurrency: z.string().min(3).default("USD"),
  allowedCurrencies: z
    .union([z.array(z.string()), z.string()])
    .transform((val) =>
      typeof val === "string"
        ? val
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : val,
    )
    .default(["USD"]),
  isPasswordProtected: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === "on"),
  password: z.string().optional().default(""),
  passwordHint: z.string().optional().default(""),
  expiresAt: z.string().optional().default(""),
});

export async function loader({ params, context }: Route.LoaderArgs) {
  const { organization, headers } = context.get(organizationMembershipContext);

  const invoiceTemplates = await retrieveTemplatesByOrganizationIdAndType({
    organizationId: organization.id,
    type: "invoice",
  });
  const receiptTemplates = await retrieveTemplatesByOrganizationIdAndType({
    organizationId: organization.id,
    type: "receipt",
  });

  return data(
    {
      breadcrumb: {
        title: "New Checkout Page",
        to: href("/organizations/:organizationSlug/checkout-pages/new", {
          organizationSlug: params.organizationSlug,
        }),
      },
      invoiceTemplates: [...getTemplatesByType("invoice"), ...invoiceTemplates],
      organizationName: organization.name,
      organizationSlug: params.organizationSlug,
      receiptTemplates,
    },
    { headers },
  );
}

function getInvoiceItemsFromTemplateSections(sections: TemplateSection[]) {
  const invoiceItemsSection = sections.find((s) => s.type === "invoice-items");
  const items = invoiceItemsSection?.data?.items;
  return Array.isArray(items) ? items : [];
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const { organization, headers } = context.get(organizationMembershipContext);
  const formData = await request.formData();
  const payload = {
    allowedCurrencies: formData.get("allowedCurrencies"),
    defaultCurrency: formData.get("defaultCurrency"),
    description: formData.get("description"),
    expiresAt: formData.get("expiresAt"),
    headerBackgroundColor: formData.get("headerBackgroundColor"),
    headerLogoUrl: formData.get("headerLogoUrl"),
    headerTextColor: formData.get("headerTextColor"),
    invoiceTemplateId: formData.get("invoiceTemplateId"),
    intent: formData.get("intent"),
    isPasswordProtected: formData.get("isPasswordProtected"),
    itemsJson: formData.get("itemsJson"),
    itemsSource: formData.get("itemsSource"),
    layout: formData.get("layout"),
    name: formData.get("name"),
    password: formData.get("password"),
    passwordHint: formData.get("passwordHint"),
    paymentProviders: formData.get("paymentProviders"),
    receiptTemplateId: formData.get("receiptTemplateId"),
    slug: formData.get("slug"),
  };

  const parsed = await createSchema.safeParseAsync(payload);
  if (!parsed.success) {
    return data(
      {
        error: parsed.error.flatten().formErrors.join("\n") || "Invalid input",
      },
      { status: 400, headers },
    );
  }

  const {
    allowedCurrencies,
    defaultCurrency,
    description,
    expiresAt,
    headerBackgroundColor,
    headerLogoUrl,
    headerTextColor,
    invoiceTemplateId,
    isPasswordProtected,
    itemsJson,
    itemsSource,
    layout,
    name,
    password,
    passwordHint,
    paymentProviders,
    receiptTemplateId,
    slug,
  } = parsed.data;

  const baseSlug = slugify(slug || name);
  const finalSlug = baseSlug ? baseSlug : `checkout-${cuid()}`;

  const passwordHash =
    isPasswordProtected && password ? await bcrypt.hash(password, 10) : null;

  const now = new Date();
  const parsedExpiresAt =
    expiresAt && expiresAt.length > 0 ? new Date(expiresAt) : null;

  let checkoutItems: unknown[] = [];
  if (itemsSource === "manual") {
    checkoutItems = JSON.parse(itemsJson) as unknown[];
  }

  if (itemsSource === "invoice-template") {
    const dbTemplate = invoiceTemplateId
      ? await retrieveTemplateFromDatabaseById({
          organizationId: organization.id,
          templateId: invoiceTemplateId,
        })
      : null;
    const fallback = invoiceTemplateId
      ? getTemplateById(invoiceTemplateId)
      : undefined;
    const sourceTemplate = dbTemplate ?? fallback ?? null;
    if (!sourceTemplate) {
      return data(
        { error: "Invoice template not found" },
        { status: 400, headers },
      );
    }
    checkoutItems = getInvoiceItemsFromTemplateSections(
      sourceTemplate.sections as TemplateSection[],
    );
  }

  const sections = [
    {
      id: "checkout-header",
      type: "checkout-header",
      order: 0,
      usingGlobalPalette: true,
      colorPalette: [],
      styles: {
        ...(headerBackgroundColor
          ? { backgroundColor: headerBackgroundColor }
          : {}),
        ...(headerTextColor ? { color: headerTextColor } : {}),
      },
      data: {
        storeName: organization.name,
        storeLogo: headerLogoUrl || organization.imageUrl,
        storeEmail: organization.billingEmail,
      },
    },
    {
      id: "checkout-items",
      type: "checkout-items",
      order: 1,
      usingGlobalPalette: true,
      colorPalette: [],
      styles: {},
      data: {
        items: checkoutItems,
        source: {
          type: itemsSource,
          invoiceTemplateId:
            itemsSource === "invoice-template" ? invoiceTemplateId : null,
        },
      },
    },
    {
      id: "checkout-payment-form",
      type: "checkout-payment-form",
      order: 2,
      usingGlobalPalette: true,
      colorPalette: [],
      styles: {},
      data: {
        providers: paymentProviders,
        defaultCurrency,
        allowedCurrencies,
      },
    },
    {
      id: "checkout-footer",
      type: "checkout-footer",
      order: 3,
      usingGlobalPalette: true,
      colorPalette: [],
      styles: {},
      data: {},
    },
  ];

  try {
    const created = await createCheckoutPageToDatabase({
      allowedCurrencies,
      defaultCurrency,
      description: description || null,
      expiresAt: parsedExpiresAt,
      globalStyles: {
        currency: defaultCurrency,
        createdAt: now.toISOString(),
        layout,
      },
      isActive: true,
      isPasswordProtected,
      name,
      organizationId: organization.id,
      passwordHash,
      passwordHint: passwordHint || null,
      paymentProviders,
      receiptTemplateId: receiptTemplateId || null,
      sections: sections as unknown as Prisma.InputJsonValue,
      slug: finalSlug,
    });

    return redirect(
      `/organizations/${params.organizationSlug}/checkout-pages/${created.id}`,
      { headers },
    );
  } catch (error) {
    const message = getErrorMessage(error);
    const isDuplicateSlug =
      message.toLowerCase().includes("unique constraint") ||
      message.toLowerCase().includes("unique") ||
      message.toLowerCase().includes("checkoutpage_slug_key");

    return data(
      {
        error: isDuplicateSlug
          ? "That slug is already taken. Please change the slug and try again."
          : message,
      },
      { status: 400, headers },
    );
  }
}

type StepId = "design" | "products" | "receipt" | "payment" | "security";
const steps: Array<{ id: StepId; label: string }> = [
  { id: "design", label: "Design" },
  { id: "products", label: "Products" },
  { id: "receipt", label: "Receipt" },
  { id: "payment", label: "Payment" },
  { id: "security", label: "Security" },
];

export default function NewCheckoutPageRoute({
  loaderData,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher<typeof action>();
  const [stepIndex, setStepIndex] = React.useState(0);
  const firstStep = steps[0];
  if (!firstStep) {
    throw new Error("Checkout steps misconfigured");
  }

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [layout, setLayout] = React.useState<
    "centered-card" | "split" | "minimal"
  >("centered-card");
  const [headerLogoUrl, setHeaderLogoUrl] = React.useState("");
  const [headerBackgroundColor, setHeaderBackgroundColor] =
    React.useState("#ffffff");
  const [headerTextColor, setHeaderTextColor] = React.useState("#000000");
  const [itemsSource, setItemsSource] = React.useState<
    "manual" | "invoice-template"
  >("manual");
  const [invoiceTemplateId, setInvoiceTemplateId] = React.useState<string>("");
  const [invoiceProducts, setInvoiceProducts] = React.useState<unknown[]>([]);
  const [manualItems, setManualItems] = React.useState<
    Array<{
      id: string;
      description: string;
      quantity: string;
      unitPrice: string;
      total: string;
    }>
  >([
    {
      id: crypto.randomUUID(),
      description: "",
      quantity: "1",
      unitPrice: "0.00",
      total: "0.00",
    },
  ]);
  const [receiptTemplateId, setReceiptTemplateId] = React.useState<string>("");
  const [receiptPreviewOpen, setReceiptPreviewOpen] = React.useState(false);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = React.useState<
    string | null
  >(null);
  const [receiptPreviewGenerating, setReceiptPreviewGenerating] =
    React.useState(false);
  const [invoicePreviewOpen, setInvoicePreviewOpen] = React.useState(false);
  const [invoicePreviewUrl, setInvoicePreviewUrl] = React.useState<
    string | null
  >(null);
  const [invoicePreviewGenerating, setInvoicePreviewGenerating] =
    React.useState(false);

  const [providerStripe, setProviderStripe] = React.useState(true);
  const [providerPaystack, setProviderPaystack] = React.useState(true);
  const [defaultCurrency, setDefaultCurrency] = React.useState("USD");
  const [allowedCurrencies, setAllowedCurrencies] = React.useState("USD,NGN");

  const [isPasswordProtected, setIsPasswordProtected] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [passwordHint, setPasswordHint] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");

  const step = steps.at(stepIndex) ?? firstStep;
  const canGoBack = stepIndex > 0;
  const canGoNext = stepIndex < steps.length - 1;

  function getPreviewProducts(): CheckoutLineItem[] {
    if (itemsSource === "invoice-template" && invoiceProducts.length > 0) {
      return invoiceProducts.map((raw) => {
        const p =
          typeof raw === "object" && raw !== null
            ? (raw as Record<string, unknown>)
            : {};
        return {
          description: String(p.description ?? ""),
          quantity: String(p.quantity ?? "1"),
          unitPrice: String(p.unitPrice ?? "0"),
          total: String(p.total ?? "0"),
        };
      });
    }
    if (manualItems.some((i) => i.description || i.unitPrice || i.quantity)) {
      return manualItems.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total,
      }));
    }
    return [
      {
        description: "Sample product",
        quantity: "1",
        unitPrice: "99.00",
        total: "99.00",
      },
    ];
  }

  const paymentProviders = [
    providerStripe ? "stripe" : null,
    providerPaystack ? "paystack" : null,
  ].filter(Boolean) as string[];

  const extractInvoiceProducts = React.useCallback(
    (templateId: string) => {
      const template = loaderData.invoiceTemplates.find(
        (t) => t.id === templateId,
      );
      if (!template) return [];
      const sections = template.sections as unknown as TemplateSection[];
      const invoiceItems = sections.find((s) => s.type === "invoice-items");
      const items = invoiceItems?.data?.items;
      return Array.isArray(items) ? items : [];
    },
    [loaderData.invoiceTemplates],
  );

  React.useEffect(() => {
    if (itemsSource !== "invoice-template") {
      setInvoiceProducts([]);
      return;
    }
    if (!invoiceTemplateId) {
      setInvoiceProducts([]);
      return;
    }
    setInvoiceProducts(extractInvoiceProducts(invoiceTemplateId));
  }, [extractInvoiceProducts, invoiceTemplateId, itemsSource]);

  const generateReceiptPreview = React.useCallback(async () => {
    if (!receiptTemplateId) return;
    setReceiptPreviewGenerating(true);
    setReceiptPreviewUrl(null);

    try {
      const response = await fetch(
        `/organizations/${loaderData.organizationSlug}/templates/${receiptTemplateId}/preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sections: {} }),
        },
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.message ||
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Failed to generate preview",
        );
      }

      const html = await response.text();
      if (!html || html.trim().length === 0) {
        throw new Error("Received empty response from server");
      }

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setReceiptPreviewUrl(url);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate preview. Please try again.";
      alert(errorMessage);
    } finally {
      setReceiptPreviewGenerating(false);
    }
  }, [loaderData.organizationSlug, receiptTemplateId]);

  const onReceiptPreviewOpenChange = (open: boolean) => {
    if (!open && receiptPreviewUrl) {
      URL.revokeObjectURL(receiptPreviewUrl);
      setReceiptPreviewUrl(null);
    }
    setReceiptPreviewOpen(open);
  };

  React.useEffect(() => {
    if (
      receiptPreviewOpen &&
      receiptTemplateId &&
      !receiptPreviewUrl &&
      !receiptPreviewGenerating
    ) {
      void generateReceiptPreview();
    }
  }, [
    receiptPreviewOpen,
    receiptTemplateId,
    receiptPreviewUrl,
    receiptPreviewGenerating,
    generateReceiptPreview,
  ]);

  React.useEffect(() => {
    return () => {
      if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
    };
  }, [receiptPreviewUrl]);

  const generateInvoicePreview = React.useCallback(async () => {
    if (!invoiceTemplateId) return;
    setInvoicePreviewGenerating(true);
    setInvoicePreviewUrl(null);

    try {
      const response = await fetch(
        `/organizations/${loaderData.organizationSlug}/templates/${invoiceTemplateId}/preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sections: {} }),
        },
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.message ||
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Failed to generate preview",
        );
      }

      const html = await response.text();
      if (!html || html.trim().length === 0) {
        throw new Error("Received empty response from server");
      }

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setInvoicePreviewUrl(url);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate preview. Please try again.";
      alert(errorMessage);
    } finally {
      setInvoicePreviewGenerating(false);
    }
  }, [loaderData.organizationSlug, invoiceTemplateId]);

  const onInvoicePreviewOpenChange = (open: boolean) => {
    if (!open && invoicePreviewUrl) {
      URL.revokeObjectURL(invoicePreviewUrl);
      setInvoicePreviewUrl(null);
    }
    setInvoicePreviewOpen(open);
  };

  React.useEffect(() => {
    if (
      invoicePreviewOpen &&
      invoiceTemplateId &&
      !invoicePreviewUrl &&
      !invoicePreviewGenerating
    ) {
      void generateInvoicePreview();
    }
  }, [
    invoicePreviewOpen,
    invoiceTemplateId,
    invoicePreviewUrl,
    invoicePreviewGenerating,
    generateInvoicePreview,
  ]);

  React.useEffect(() => {
    return () => {
      if (invoicePreviewUrl) URL.revokeObjectURL(invoicePreviewUrl);
    };
  }, [invoicePreviewUrl]);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          onClick={() =>
            navigate(
              `/organizations/${loaderData.organizationSlug}/checkout-pages`,
            )
          }
          size="icon"
          variant="ghost"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Create checkout page</h1>
          <p className="text-muted-foreground text-sm">
            Step {stepIndex + 1} of {steps.length}: {step.label}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {steps.map((s, i) => (
          <div
            className={[
              "rounded-md border px-3 py-2 text-sm",
              i === stepIndex ? "border-primary" : "border-border",
            ].join(" ")}
            key={s.id}
          >
            <div className="flex items-center justify-between">
              <span>{s.label}</span>
              {i < stepIndex ? (
                <Check className="h-4 w-4 text-primary" />
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {actionData && "error" in actionData && actionData.error ? (
        <div className="max-w-2xl rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {actionData.error}
        </div>
      ) : null}

      <div
        className={
          step.id === "design"
            ? "w-full max-w-6xl space-y-6"
            : "max-w-2xl space-y-6"
        }
      >
        {step.id === "design" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Product Launch Checkout"
                  value={name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="layout">Layout</Label>
                <Select
                  onValueChange={(value) =>
                    setLayout(value as "centered-card" | "split" | "minimal")
                  }
                  value={layout}
                >
                  <SelectTrigger id="layout">
                    <SelectValue placeholder="Select a layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="centered-card">Centered card</SelectItem>
                    <SelectItem value="split">Split</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Layout selection is saved now. Public checkout rendering will
                  use it in a future iteration.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="headerLogoUrl">
                  Header logo URL (optional)
                </Label>
                <Input
                  id="headerLogoUrl"
                  onChange={(e) => setHeaderLogoUrl(e.target.value)}
                  placeholder="https://..."
                  value={headerLogoUrl}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="headerBackgroundColor">
                  Header background color
                </Label>
                <Input
                  id="headerBackgroundColor"
                  onChange={(e) => setHeaderBackgroundColor(e.target.value)}
                  type="color"
                  value={headerBackgroundColor}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="headerTextColor">Header text color</Label>
                <Input
                  id="headerTextColor"
                  onChange={(e) => setHeaderTextColor(e.target.value)}
                  type="color"
                  value={headerTextColor}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (optional)</Label>
                <Input
                  id="slug"
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="product-launch-2026"
                  value={slug}
                />
                <p className="text-muted-foreground text-xs">
                  Public URL will be `/checkout/&lt;slug&gt;`. If left blank,
                  we’ll generate one from the name.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description for internal use."
                  value={description}
                />
              </div>
            </div>

            <div className="lg:sticky lg:top-6 lg:self-start">
              <Label className="mb-2 block">Preview</Label>
              <div className="rounded-lg border bg-muted/10 p-4">
                <CheckoutPageRenderer
                  description={description || undefined}
                  header={{
                    backgroundColor: headerBackgroundColor || null,
                    storeLogo: headerLogoUrl || null,
                    storeName: loaderData.organizationName ?? "Your store",
                    textColor: headerTextColor || null,
                  }}
                  layout={layout}
                  pageName={name || "Checkout"}
                  paymentForm={{
                    allowedCurrencies: allowedCurrencies
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                    defaultCurrency,
                    providers: paymentProviders,
                  }}
                  previewMode
                  products={getPreviewProducts()}
                />
              </div>
            </div>
          </div>
        ) : null}

        {step.id === "products" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Products source</Label>
              <div className="flex flex-col gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    checked={itemsSource === "manual"}
                    name="itemsSourceRadio"
                    onChange={() => setItemsSource("manual")}
                    type="radio"
                  />
                  <span>Manual products</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    checked={itemsSource === "invoice-template"}
                    name="itemsSourceRadio"
                    onChange={() => setItemsSource("invoice-template")}
                    type="radio"
                  />
                  <span>From invoice template</span>
                </label>
              </div>
            </div>

            {itemsSource === "invoice-template" ? (
              <div className="space-y-2">
                <Label>Invoice template</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      onValueChange={(value) => {
                        setInvoiceTemplateId(value);
                        setInvoiceProducts(extractInvoiceProducts(value));
                      }}
                      value={invoiceTemplateId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an invoice template" />
                      </SelectTrigger>
                      <SelectContent>
                        {loaderData.invoiceTemplates.map((tpl) => (
                          <SelectItem key={tpl.id} value={tpl.id}>
                            {tpl.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {invoiceTemplateId ? (
                    <Button
                      onClick={() => setInvoicePreviewOpen(true)}
                      type="button"
                      variant="outline"
                    >
                      Preview invoice
                    </Button>
                  ) : null}
                </div>

                {invoiceProducts.length > 0 ? (
                  <div className="mt-3 rounded-md border bg-muted/20 p-3">
                    <div className="text-xs font-medium mb-2">
                      Products preview
                    </div>
                    <div className="space-y-3">
                      {invoiceProducts.map((raw, idx) => {
                        const product =
                          typeof raw === "object" && raw !== null
                            ? (raw as Record<string, unknown>)
                            : {};

                        const description = String(product.description ?? "");
                        const quantity = String(product.quantity ?? "");
                        const unitPrice = String(product.unitPrice ?? "");
                        const total = String(product.total ?? "");

                        const key =
                          typeof product.id === "string" &&
                          product.id.length > 0
                            ? product.id
                            : `${description}-${quantity}-${unitPrice}-${total}-${idx}`;

                        return (
                          <div className="grid gap-3 md:grid-cols-4" key={key}>
                            <div className="md:col-span-2">
                              <Label>Description</Label>
                              <Input disabled value={description} />
                            </div>
                            <div>
                              <Label>Qty</Label>
                              <Input disabled value={quantity} />
                            </div>
                            <div>
                              <Label>Unit price</Label>
                              <Input disabled value={unitPrice} />
                            </div>
                            <div className="md:col-span-4">
                              <Label>Total</Label>
                              <Input disabled value={total} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Select a template to preview its products.
                  </div>
                )}

                <div className="rounded-md border bg-background p-3 text-xs text-muted-foreground">
                  Note: This checkout will be attached to the selected invoice
                  template.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-muted-foreground text-xs">
                  Products are fixed on the public checkout. Customers won’t be
                  able to edit them.
                </div>
                <div className="space-y-3">
                  {manualItems.map((item, idx) => (
                    <div className="grid gap-3 md:grid-cols-4" key={item.id}>
                      <div className="md:col-span-2">
                        <Label htmlFor={`desc-${idx}`}>Description</Label>
                        <Input
                          id={`desc-${idx}`}
                          onChange={(e) =>
                            setManualItems((prev) =>
                              prev.map((p, i) =>
                                i === idx
                                  ? { ...p, description: e.target.value }
                                  : p,
                              ),
                            )
                          }
                          value={item.description}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`qty-${idx}`}>Qty</Label>
                        <Input
                          id={`qty-${idx}`}
                          onChange={(e) =>
                            setManualItems((prev) =>
                              prev.map((p, i) =>
                                i === idx
                                  ? { ...p, quantity: e.target.value }
                                  : p,
                              ),
                            )
                          }
                          value={item.quantity}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`unit-${idx}`}>Unit price</Label>
                        <Input
                          id={`unit-${idx}`}
                          onChange={(e) =>
                            setManualItems((prev) =>
                              prev.map((p, i) =>
                                i === idx
                                  ? { ...p, unitPrice: e.target.value }
                                  : p,
                              ),
                            )
                          }
                          value={item.unitPrice}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() =>
                      setManualItems((prev) => [
                        ...prev,
                        {
                          id: crypto.randomUUID(),
                          description: "",
                          quantity: "1",
                          unitPrice: "0.00",
                          total: "0.00",
                        },
                      ])
                    }
                    type="button"
                    variant="outline"
                  >
                    Add product
                  </Button>
                  <Button
                    disabled={manualItems.length <= 1}
                    onClick={() => setManualItems((prev) => prev.slice(0, -1))}
                    type="button"
                    variant="outline"
                  >
                    Remove last
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {step.id === "receipt" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Receipt template</Label>
              <Select
                onValueChange={setReceiptTemplateId}
                value={receiptTemplateId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a receipt template" />
                </SelectTrigger>
                <SelectContent>
                  {loaderData.receiptTemplates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                This template will be used for auto-generated receipts after
                successful payment.
              </p>
              <div className="pt-1">
                <Button
                  disabled={!receiptTemplateId}
                  onClick={() => setReceiptPreviewOpen(true)}
                  type="button"
                  variant="outline"
                >
                  Preview receipt
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {step.id === "payment" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Providers</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={providerStripe}
                    id="providerStripe"
                    onCheckedChange={(v) => setProviderStripe(Boolean(v))}
                  />
                  <Label htmlFor="providerStripe">Stripe</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={providerPaystack}
                    id="providerPaystack"
                    onCheckedChange={(v) => setProviderPaystack(Boolean(v))}
                  />
                  <Label htmlFor="providerPaystack">Paystack</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Default currency</Label>
              <Input
                id="defaultCurrency"
                onChange={(e) =>
                  setDefaultCurrency(e.target.value.toUpperCase())
                }
                value={defaultCurrency}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allowedCurrencies">
                Allowed currencies (comma-separated)
              </Label>
              <Input
                id="allowedCurrencies"
                onChange={(e) =>
                  setAllowedCurrencies(e.target.value.toUpperCase())
                }
                value={allowedCurrencies}
              />
            </div>
          </div>
        ) : null}

        {step.id === "security" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isPasswordProtected}
                id="isPasswordProtected"
                onCheckedChange={(v) => setIsPasswordProtected(Boolean(v))}
              />
              <Label htmlFor="isPasswordProtected">
                Password protect this checkout page
              </Label>
            </div>
            {isPasswordProtected ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    value={password}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordHint">Password hint (optional)</Label>
                  <Input
                    id="passwordHint"
                    onChange={(e) => setPasswordHint(e.target.value)}
                    value={passwordHint}
                  />
                </div>
              </>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expires at (optional)</Label>
              <Input
                id="expiresAt"
                onChange={(e) => setExpiresAt(e.target.value)}
                type="datetime-local"
                value={expiresAt}
              />
            </div>
          </div>
        ) : null}
      </div>

      <Dialog
        onOpenChange={onReceiptPreviewOpenChange}
        open={receiptPreviewOpen}
      >
        <DialogContent className="w-[95vw]! max-w-[210mm]! h-[90vh]! flex flex-col">
          <DialogHeader>
            <DialogTitle>Receipt preview</DialogTitle>
          </DialogHeader>

          {receiptPreviewUrl ? (
            <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
              <iframe
                className="w-full h-full border-0"
                src={receiptPreviewUrl}
                title="Receipt Preview"
              />
            </div>
          ) : (
            <div className="mt-4 border rounded-lg overflow-hidden p-8 text-center text-muted-foreground">
              {receiptPreviewGenerating ? (
                <p>Generating preview...</p>
              ) : (
                <p>Loading preview...</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={onInvoicePreviewOpenChange}
        open={invoicePreviewOpen}
      >
        <DialogContent className="w-[95vw]! max-w-[210mm]! h-[90vh]! flex flex-col">
          <DialogHeader>
            <DialogTitle>Invoice preview</DialogTitle>
          </DialogHeader>

          {invoicePreviewUrl ? (
            <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
              <iframe
                className="w-full h-full border-0"
                src={invoicePreviewUrl}
                title="Invoice Preview"
              />
            </div>
          ) : (
            <div className="mt-4 border rounded-lg overflow-hidden p-8 text-center text-muted-foreground">
              {invoicePreviewGenerating ? (
                <p>Generating preview...</p>
              ) : (
                <p>Loading preview...</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between pt-2">
        <Button
          disabled={!canGoBack}
          onClick={() => setStepIndex((s) => Math.max(0, s - 1))}
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {canGoNext ? (
          <Button
            onClick={() =>
              setStepIndex((s) => Math.min(steps.length - 1, s + 1))
            }
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <fetcher.Form method="post">
            <input name="intent" type="hidden" value="create" />
            <input name="name" type="hidden" value={name} />
            <input name="slug" type="hidden" value={slug} />
            <input name="description" type="hidden" value={description} />
            <input name="layout" type="hidden" value={layout} />
            <input name="headerLogoUrl" type="hidden" value={headerLogoUrl} />
            <input
              name="headerBackgroundColor"
              type="hidden"
              value={headerBackgroundColor}
            />
            <input
              name="headerTextColor"
              type="hidden"
              value={headerTextColor}
            />
            <input name="itemsSource" type="hidden" value={itemsSource} />
            <input
              name="invoiceTemplateId"
              type="hidden"
              value={invoiceTemplateId}
            />
            <input
              name="itemsJson"
              type="hidden"
              value={JSON.stringify(manualItems)}
            />
            <input
              name="receiptTemplateId"
              type="hidden"
              value={receiptTemplateId}
            />
            <input
              name="paymentProviders"
              type="hidden"
              value={paymentProviders.join(",")}
            />
            <input
              name="defaultCurrency"
              type="hidden"
              value={defaultCurrency}
            />
            <input
              name="allowedCurrencies"
              type="hidden"
              value={allowedCurrencies}
            />
            <input
              name="isPasswordProtected"
              type="hidden"
              value={isPasswordProtected ? "on" : ""}
            />
            <input name="password" type="hidden" value={password} />
            <input name="passwordHint" type="hidden" value={passwordHint} />
            <input name="expiresAt" type="hidden" value={expiresAt} />
            <Button
              disabled={
                fetcher.state !== "idle" ||
                name.trim().length === 0 ||
                paymentProviders.length === 0 ||
                (itemsSource === "invoice-template" &&
                  invoiceTemplateId.trim().length === 0)
              }
              type="submit"
            >
              Create
            </Button>
          </fetcher.Form>
        )}
      </div>
    </div>
  );
}
