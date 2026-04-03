import { init } from "@paralleldrive/cuid2";
import bcrypt from "bcryptjs";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
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
import { CurrencyPicker } from "~/components/currency-picker";
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
import { checkoutItemsAndTotalsFromInvoiceTemplateSections } from "~/features/checkout/checkout-from-invoice-template";
import { createCheckoutPageToDatabase } from "~/features/checkout/checkout-pages-model.server";
import type {
  CheckoutLineItem,
  CheckoutTotalsData,
} from "~/features/checkout/checkout-sections";
import {
  defaultCheckoutTotals,
  parseManualCheckoutItemsJson,
  recalculateCheckoutTotals,
} from "~/features/checkout/checkout-sections";
import { CheckoutPageRenderer } from "~/features/checkout/components/checkout-page-renderer";
import { CheckoutTotalsFields } from "~/features/checkout/components/checkout-totals-fields";
import {
  isCurrencySupportedByPaystack,
  isCurrencySupportedByStripe,
} from "~/features/checkout/payment-provider-currencies";
import { resolveInvoiceTemplateCurrency } from "~/features/checkout/resolve-invoice-template-currency";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { getCommonCurrencyLabel } from "~/features/templates/shared/common-currencies";
import { getTemplateById } from "~/features/templates/shared/templates";
import {
  retrieveTemplateFromDatabaseById,
  retrieveTemplatesByOrganizationIdAndType,
} from "~/features/templates/shared/templates-model.server";
import type {
  Template,
  TemplateSection,
} from "~/features/templates/shared/types";
import type { Prisma } from "~/generated/client";
import { cn } from "~/lib/utils";
import { getErrorMessage } from "~/utils/get-error-message";
import { slugify } from "~/utils/slugify";

const cuid = init({ length: 6 });

function initialCurrencyForNewCheckoutPage(templates: Template[]): string {
  const first = templates[0];
  return first ? resolveInvoiceTemplateCurrency(first.id, templates) : "USD";
}

/** Short debounce keeps checks snappy while avoiding a request per keystroke. */
const SLUG_AVAILABILITY_DEBOUNCE_MS = 120;

type SlugAvailabilityUiState =
  | { kind: "unused" }
  | { kind: "available"; normalized: string }
  | { kind: "taken"; normalized: string }
  | { kind: "error" };

/** Loader JSON from `new+/slug-availability` (useFetcher decodes RR single-fetch). */
type SlugAvailabilityLoaderData = {
  checked: boolean;
  available: boolean;
  normalized: string | null;
};

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
    .default("split"),
  itemsSource: z
    .enum(["manual", "invoice-template"])
    .default("invoice-template"),
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
      invoiceTemplates,
      organizationName: organization.name,
      organizationSlug: params.organizationSlug,
      receiptTemplates,
    },
    { headers },
  );
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

  const customSlug = slugify(slug.trim());
  const finalSlug = customSlug.length > 0 ? customSlug : cuid();

  const passwordHash =
    isPasswordProtected && password ? await bcrypt.hash(password, 10) : null;

  const now = new Date();
  const parsedExpiresAt =
    expiresAt && expiresAt.length > 0 ? new Date(expiresAt) : null;

  let checkoutItems: unknown[] = [];
  let checkoutTotals: CheckoutTotalsData | null = null;

  if (itemsSource === "manual") {
    const parsedManual = parseManualCheckoutItemsJson(itemsJson);
    if (!parsedManual) {
      return data(
        { error: "Invalid manual products data" },
        { status: 400, headers },
      );
    }
    checkoutItems = parsedManual.items;
    checkoutTotals = parsedManual.totals;
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
    const fromInvoice = checkoutItemsAndTotalsFromInvoiceTemplateSections(
      sourceTemplate.sections as TemplateSection[],
    );
    checkoutItems = fromInvoice.items;
    checkoutTotals = fromInvoice.totals;
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
        totals: checkoutTotals ?? defaultCheckoutTotals(),
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
  const slugCheckFetcher = useFetcher<SlugAvailabilityLoaderData>({
    key: "checkout-new-slug",
  });
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
  >("split");
  const [headerLogoUrl, setHeaderLogoUrl] = React.useState("");
  const [headerBackgroundColor, setHeaderBackgroundColor] =
    React.useState("#ffffff");
  const [headerTextColor, setHeaderTextColor] = React.useState("#000000");
  const [itemsSource, setItemsSource] = React.useState<
    "manual" | "invoice-template"
  >("invoice-template");
  const [invoiceTemplateId, setInvoiceTemplateId] = React.useState(
    () => loaderData.invoiceTemplates[0]?.id ?? "",
  );
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
  const [manualTotals, setManualTotals] = React.useState<CheckoutTotalsData>(
    () => defaultCheckoutTotals(),
  );
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

  const [defaultCurrency, setDefaultCurrency] = React.useState(() =>
    initialCurrencyForNewCheckoutPage(loaderData.invoiceTemplates),
  );
  const [providerStripe, setProviderStripe] = React.useState(() =>
    isCurrencySupportedByStripe(
      initialCurrencyForNewCheckoutPage(loaderData.invoiceTemplates),
    ),
  );
  const [providerPaystack, setProviderPaystack] = React.useState(() =>
    isCurrencySupportedByPaystack(
      initialCurrencyForNewCheckoutPage(loaderData.invoiceTemplates),
    ),
  );

  const [isPasswordProtected, setIsPasswordProtected] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [passwordHint, setPasswordHint] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [slugAvailability, setSlugAvailability] =
    React.useState<SlugAvailabilityUiState>({ kind: "unused" });
  const [slugCheckPending, setSlugCheckPending] = React.useState(false);
  const prevSlugFetcherState = React.useRef(slugCheckFetcher.state);

  const step = steps.at(stepIndex) ?? firstStep;
  const canGoBack = stepIndex > 0;
  const normalizedCustomSlug = slugify(slug.trim());
  const slugTakenBlocksProgress =
    normalizedCustomSlug.length > 0 &&
    slugAvailability.kind === "taken" &&
    !slugCheckPending;
  const canGoNext = stepIndex < steps.length - 1;
  const designNextDisabled = step.id === "design" && slugTakenBlocksProgress;

  const paymentProviders = [
    providerStripe && isCurrencySupportedByStripe(defaultCurrency)
      ? "stripe"
      : null,
    providerPaystack && isCurrencySupportedByPaystack(defaultCurrency)
      ? "paystack"
      : null,
  ].filter(Boolean) as string[];

  React.useEffect(() => {
    setProviderStripe(isCurrencySupportedByStripe(defaultCurrency));
    setProviderPaystack(isCurrencySupportedByPaystack(defaultCurrency));
  }, [defaultCurrency]);

  React.useEffect(() => {
    const normalized = slugify(slug.trim());
    if (!normalized) {
      setSlugCheckPending(false);
      setSlugAvailability({ kind: "unused" });
      return;
    }

    setSlugAvailability({ kind: "unused" });
    setSlugCheckPending(true);
    const timer = window.setTimeout(() => {
      const qs = new URLSearchParams({ slug: slug.trim() });
      slugCheckFetcher.load(
        `/organizations/${loaderData.organizationSlug}/checkout-pages/new/slug-availability?${qs.toString()}`,
      );
    }, SLUG_AVAILABILITY_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [slug, loaderData.organizationSlug, slugCheckFetcher.load]);

  React.useEffect(() => {
    const state = slugCheckFetcher.state;
    const prev = prevSlugFetcherState.current;
    prevSlugFetcherState.current = state;

    if (state !== "idle") {
      return;
    }

    const finishedLoad = prev === "loading";

    if (finishedLoad) {
      setSlugCheckPending(false);
    }

    const payload = slugCheckFetcher.data;
    if (
      finishedLoad &&
      (payload == null ||
        typeof payload !== "object" ||
        !("checked" in payload))
    ) {
      setSlugAvailability({ kind: "error" });
      return;
    }

    if (
      payload == null ||
      typeof payload !== "object" ||
      !("checked" in payload)
    ) {
      return;
    }

    const now = slugify(slug.trim());
    if (!now) {
      setSlugAvailability({ kind: "unused" });
      return;
    }

    if (!payload.checked || !payload.normalized || payload.normalized !== now) {
      return;
    }

    setSlugAvailability(
      payload.available
        ? { kind: "available", normalized: payload.normalized }
        : { kind: "taken", normalized: payload.normalized },
    );
  }, [slug, slugCheckFetcher.state, slugCheckFetcher.data]);

  React.useEffect(() => {
    const lines: CheckoutLineItem[] = manualItems.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.total,
    }));
    setManualTotals((prev) => recalculateCheckoutTotals(lines, prev));
  }, [manualItems]);

  const invoiceTemplatePayload = React.useMemo(() => {
    if (itemsSource !== "invoice-template" || !invoiceTemplateId) {
      return null;
    }
    const tpl =
      loaderData.invoiceTemplates.find((t) => t.id === invoiceTemplateId) ??
      getTemplateById(invoiceTemplateId);
    if (!tpl) return null;
    return checkoutItemsAndTotalsFromInvoiceTemplateSections(
      tpl.sections as TemplateSection[],
    );
  }, [itemsSource, invoiceTemplateId, loaderData.invoiceTemplates]);

  const previewLineItems = React.useMemo((): CheckoutLineItem[] => {
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
  }, [itemsSource, invoiceProducts, manualItems]);

  const previewOrderTotals = React.useMemo((): CheckoutTotalsData | null => {
    if (itemsSource === "invoice-template") {
      return invoiceTemplatePayload?.totals ?? null;
    }
    return recalculateCheckoutTotals(previewLineItems, manualTotals);
  }, [itemsSource, invoiceTemplatePayload, previewLineItems, manualTotals]);

  const extractInvoiceProducts = React.useCallback(
    (templateId: string) => {
      const template =
        loaderData.invoiceTemplates.find((t) => t.id === templateId) ??
        getTemplateById(templateId);
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

  React.useEffect(() => {
    if (itemsSource !== "invoice-template" || !invoiceTemplateId) return;
    setDefaultCurrency(
      resolveInvoiceTemplateCurrency(
        invoiceTemplateId,
        loaderData.invoiceTemplates,
      ),
    );
  }, [invoiceTemplateId, itemsSource, loaderData.invoiceTemplates]);

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
          ["design", "products"].includes(step.id)
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
                <p className="text-muted-foreground text-xs">
                  This is the title shown on the checkout page; it is separate
                  from the public URL slug.
                </p>
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
                <div className="relative">
                  <Input
                    aria-busy={slugCheckPending}
                    aria-invalid={
                      slugAvailability.kind === "taken" && !slugCheckPending
                    }
                    className={cn(
                      slugCheckPending &&
                        normalizedCustomSlug.length > 0 &&
                        "pr-10",
                      slugAvailability.kind === "taken" &&
                        !slugCheckPending &&
                        "border-destructive focus-visible:ring-destructive/30",
                    )}
                    id="slug"
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="product-launch-2026"
                    value={slug}
                  />
                  {slugCheckPending && normalizedCustomSlug.length > 0 ? (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 right-2 flex items-center"
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : null}
                </div>
                <p className="text-muted-foreground text-xs">
                  Public URL will be `/checkout/&lt;slug&gt;`. If you leave this
                  blank, we assign a short random slug when you create the page.
                </p>
                {normalizedCustomSlug.length > 0 ? (
                  <div className="text-xs space-y-1">
                    <p className="text-muted-foreground">
                      Resolved URL slug:{" "}
                      <span className="font-mono text-foreground">
                        {normalizedCustomSlug}
                      </span>
                    </p>
                    {!slugCheckPending &&
                    slugAvailability.kind === "available" ? (
                      <p className="text-emerald-700 dark:text-emerald-400">
                        This URL is available.
                      </p>
                    ) : null}
                    {!slugCheckPending && slugAvailability.kind === "taken" ? (
                      <p className="text-destructive">
                        This URL is already in use. Choose a different slug
                        before continuing.
                      </p>
                    ) : null}
                    {!slugCheckPending && slugAvailability.kind === "error" ? (
                      <p className="text-destructive">
                        Could not verify slug. Try again or continue and fix if
                        create fails.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    A unique slug will be assigned automatically when you create
                    the page.
                  </p>
                )}
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
                  checkoutPageSlug="preview"
                  description={description || undefined}
                  header={{
                    backgroundColor: headerBackgroundColor || null,
                    storeLogo: headerLogoUrl || null,
                    storeName: loaderData.organizationName ?? "Your store",
                    textColor: headerTextColor || null,
                  }}
                  layout={layout}
                  orderTotals={previewOrderTotals}
                  pageName={name || "Checkout"}
                  paymentForm={{
                    allowedCurrencies: [defaultCurrency],
                    defaultCurrency,
                    providers: paymentProviders,
                  }}
                  paymentProviders={paymentProviders}
                  previewMode
                  products={previewLineItems}
                />
              </div>
            </div>
          </div>
        ) : null}

        {step.id === "products" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 w-full">
            <div className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2 md:items-start">
                <div className="space-y-2 min-w-0">
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
                          setDefaultCurrency(
                            resolveInvoiceTemplateCurrency(
                              value,
                              loaderData.invoiceTemplates,
                            ),
                          );
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
                            <div
                              className="grid gap-3 md:grid-cols-4"
                              key={key}
                            >
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
                  {invoiceTemplatePayload ? (
                    <CheckoutTotalsFields
                      disabled
                      lineItems={invoiceTemplatePayload.items}
                      onChange={() => {}}
                      totals={invoiceTemplatePayload.totals}
                    />
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-muted-foreground text-xs">
                    Products are fixed on the public checkout. Customers won’t
                    be able to edit them.
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
                      onClick={() =>
                        setManualItems((prev) => prev.slice(0, -1))
                      }
                      type="button"
                      variant="outline"
                    >
                      Remove last
                    </Button>
                  </div>
                  <CheckoutTotalsFields
                    lineItems={manualItems.map((i) => ({
                      description: i.description,
                      quantity: i.quantity,
                      unitPrice: i.unitPrice,
                      total: i.total,
                    }))}
                    onChange={setManualTotals}
                    totals={manualTotals}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 w-full max-w-xs">
              <Label htmlFor="checkout-currency">Currency</Label>
              <CurrencyPicker
                className="w-full"
                disabled={itemsSource === "invoice-template"}
                id="checkout-currency"
                onValueChange={setDefaultCurrency}
                value={defaultCurrency}
              />
              <p className="text-muted-foreground text-xs">
                {itemsSource === "invoice-template"
                  ? "Currency is taken from the selected invoice template."
                  : "Pricing currency for manual line items on this checkout."}
              </p>
            </div>
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
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Currency: </span>
              <span className="font-medium">
                {getCommonCurrencyLabel(defaultCurrency)}
              </span>
            </div>
            <div className="space-y-2">
              <Label>Providers</Label>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={
                        isCurrencySupportedByStripe(defaultCurrency) &&
                        providerStripe
                      }
                      disabled={!isCurrencySupportedByStripe(defaultCurrency)}
                      id="providerStripe"
                      onCheckedChange={(v) => setProviderStripe(Boolean(v))}
                    />
                    <Label
                      className={
                        !isCurrencySupportedByStripe(defaultCurrency)
                          ? "text-muted-foreground"
                          : undefined
                      }
                      htmlFor="providerStripe"
                    >
                      Stripe
                    </Label>
                  </div>
                  <p className="text-muted-foreground text-xs pl-6">
                    {isCurrencySupportedByStripe(defaultCurrency)
                      ? "Available for your selected currency."
                      : "Use a 3-letter currency code (e.g. USD) for Stripe."}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={
                        isCurrencySupportedByPaystack(defaultCurrency) &&
                        providerPaystack
                      }
                      disabled={!isCurrencySupportedByPaystack(defaultCurrency)}
                      id="providerPaystack"
                      onCheckedChange={(v) => setProviderPaystack(Boolean(v))}
                    />
                    <Label
                      className={
                        !isCurrencySupportedByPaystack(defaultCurrency)
                          ? "text-muted-foreground"
                          : undefined
                      }
                      htmlFor="providerPaystack"
                    >
                      Paystack
                    </Label>
                  </div>
                  {!isCurrencySupportedByPaystack(defaultCurrency) ? (
                    <p className="text-muted-foreground text-xs pl-6">
                      Paystack does not support {defaultCurrency.toUpperCase()}{" "}
                      for charges. Choose Stripe or change currency on the
                      Products step.
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-xs pl-6">
                      Available when your currency is supported by Paystack.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              Currency is set in the Products step. This step is only for
              choosing how customers pay.
            </p>
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
            disabled={designNextDisabled}
            onClick={() =>
              setStepIndex((s) => Math.min(steps.length - 1, s + 1))
            }
            title={
              designNextDisabled
                ? "Choose an available slug before continuing."
                : undefined
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
              value={JSON.stringify({
                items: manualItems,
                totals: manualTotals,
              })}
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
              value={defaultCurrency}
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
                slugTakenBlocksProgress ||
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
