import bcrypt from "bcryptjs";
import { ArrowLeft, Copy, ExternalLink, Trash2 } from "lucide-react";
import * as React from "react";
import { data, href, useNavigate } from "react-router";
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
import {
  retrieveCheckoutPageFromDatabaseById,
  updateCheckoutPageInDatabase,
} from "~/features/checkout/checkout-pages-model.server";
import { parseCheckoutSections } from "~/features/checkout/checkout-sections";
import { CheckoutPageRenderer } from "~/features/checkout/components/checkout-page-renderer";
import { formatMinorUnits } from "~/features/checkout/money";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { getTemplateById } from "~/features/templates/shared/templates";
import {
  retrieveTemplateFromDatabaseById,
  retrieveTemplatesByOrganizationIdAndType,
} from "~/features/templates/shared/templates-model.server";
import type { TemplateSection } from "~/features/templates/shared/types";
import type { Prisma } from "~/generated/client";
import { notFound } from "~/utils/http-responses.server";
import { validateFormData } from "~/utils/validate-form-data.server";

const updateSchema = z.object({
  intent: z.literal("update"),
  name: z.string().min(1),
  description: z.string().optional().default(""),
  layout: z
    .enum(["centered-card", "split", "minimal"])
    .optional()
    .default("centered-card"),
  headerLogoUrl: z.string().optional().default(""),
  headerBackgroundColor: z.string().optional().default(""),
  headerTextColor: z.string().optional().default(""),
  itemsSource: z
    .enum(["manual", "invoice-template"])
    .optional()
    .default("manual"),
  invoiceTemplateId: z.string().optional().default(""),
  itemsJson: z.string().optional().default("[]"),
  receiptTemplateId: z.string().optional().default(""),
  paymentProviders: z
    .union([z.array(z.string()), z.string()])
    .transform((val) =>
      typeof val === "string" ? val.split(",").filter(Boolean) : val,
    ),
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
  isActive: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === "on"),
  isPasswordProtected: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === "on"),
  password: z.string().optional().default(""),
  passwordHint: z.string().optional().default(""),
  expiresAt: z.string().optional().default(""),
});

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function getInvoiceItemsFromTemplateSections(sections: TemplateSection[]) {
  const invoiceItemsSection = sections.find((s) => s.type === "invoice-items");
  const items = invoiceItemsSection?.data?.items;
  return Array.isArray(items) ? items : [];
}

function calcLineTotal({
  quantity,
  unitPrice,
}: {
  quantity: string;
  unitPrice: string;
}) {
  const q = Number(quantity);
  const p = Number(unitPrice);
  const total = (Number.isFinite(q) ? q : 0) * (Number.isFinite(p) ? p : 0);
  return total.toFixed(2);
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const { organization, headers } = context.get(organizationMembershipContext);

  const checkoutPage = await retrieveCheckoutPageFromDatabaseById({
    checkoutPageId: params.checkoutPageId,
    organizationId: organization.id,
  });

  if (!checkoutPage) {
    throw notFound();
  }

  const receiptTemplates = await retrieveTemplatesByOrganizationIdAndType({
    organizationId: organization.id,
    type: "receipt",
  });

  const invoiceTemplates = await retrieveTemplatesByOrganizationIdAndType({
    organizationId: organization.id,
    type: "invoice",
  });

  return data(
    {
      breadcrumb: {
        title: checkoutPage.name,
        to: href(
          "/organizations/:organizationSlug/checkout-pages/:checkoutPageId",
          {
            organizationSlug: params.organizationSlug,
            checkoutPageId: params.checkoutPageId,
          },
        ),
      },
      checkoutPage,
      organizationSlug: params.organizationSlug,
      invoiceTemplates,
      receiptTemplates,
    },
    { headers },
  );
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const { organization, headers } = context.get(organizationMembershipContext);
  const result = await validateFormData(request, updateSchema);
  if (!result.success) return result.response;

  const checkoutPage = await retrieveCheckoutPageFromDatabaseById({
    checkoutPageId: params.checkoutPageId,
    organizationId: organization.id,
  });
  if (!checkoutPage) {
    throw notFound();
  }

  const normalizedReceiptTemplateId =
    result.data.receiptTemplateId === "__none__"
      ? ""
      : result.data.receiptTemplateId;

  const parsedExpiresAt =
    result.data.expiresAt && result.data.expiresAt.length > 0
      ? new Date(result.data.expiresAt)
      : null;

  const passwordHash =
    result.data.isPasswordProtected && result.data.password
      ? await bcrypt.hash(result.data.password, 10)
      : undefined;

  const currentSections = Array.isArray(checkoutPage.sections)
    ? (checkoutPage.sections as unknown[])
    : [];

  const headerSectionIndex = currentSections.findIndex(
    (s) =>
      isRecord(s) &&
      (s.type === "checkout-header" || s.id === "checkout-header"),
  );
  const headerSection =
    headerSectionIndex >= 0 && isRecord(currentSections[headerSectionIndex])
      ? (currentSections[headerSectionIndex] as Record<string, unknown>)
      : null;

  const nextHeaderStyles = {
    ...(isRecord(headerSection?.styles)
      ? (headerSection?.styles as Record<string, unknown>)
      : {}),
    ...(result.data.headerBackgroundColor
      ? { backgroundColor: result.data.headerBackgroundColor }
      : { backgroundColor: null }),
    ...(result.data.headerTextColor
      ? { color: result.data.headerTextColor }
      : { color: null }),
  };

  const nextHeaderData = {
    ...(isRecord(headerSection?.data)
      ? (headerSection?.data as Record<string, unknown>)
      : {}),
    storeLogo:
      result.data.headerLogoUrl.length > 0 ? result.data.headerLogoUrl : null,
  };

  const nextHeaderSection: Record<string, unknown> = {
    ...(headerSection ?? {}),
    id: "checkout-header",
    type: "checkout-header",
    styles: nextHeaderStyles,
    data: nextHeaderData,
  };

  let nextItems: unknown[] | null = null;
  if (result.data.itemsSource === "invoice-template") {
    const invoiceTemplateId = result.data.invoiceTemplateId;
    if (!invoiceTemplateId) {
      return data(
        { error: "Select an invoice template" },
        { status: 400, headers },
      );
    }
    const dbTemplate = await retrieveTemplateFromDatabaseById({
      organizationId: organization.id,
      templateId: invoiceTemplateId,
    });
    const fallback = getTemplateById(invoiceTemplateId) ?? null;
    const sourceTemplate = dbTemplate ?? fallback;
    if (!sourceTemplate) {
      return data(
        { error: "Invoice template not found" },
        { status: 400, headers },
      );
    }
    nextItems = getInvoiceItemsFromTemplateSections(
      sourceTemplate.sections as TemplateSection[],
    );
  }
  if (result.data.itemsSource === "manual") {
    try {
      const parsedItems = JSON.parse(result.data.itemsJson) as unknown;
      nextItems = Array.isArray(parsedItems)
        ? parsedItems.map((raw) => {
            if (!isRecord(raw)) return raw;
            const quantity =
              typeof raw.quantity === "string" ? raw.quantity : "";
            const unitPrice =
              typeof raw.unitPrice === "string" ? raw.unitPrice : "";
            return {
              ...raw,
              total: calcLineTotal({ quantity, unitPrice }),
            };
          })
        : [];
    } catch {
      return data({ error: "Invalid manual items" }, { status: 400, headers });
    }
  }

  const itemsSectionIndex = currentSections.findIndex(
    (s) =>
      isRecord(s) && (s.type === "checkout-items" || s.id === "checkout-items"),
  );
  const itemsSection =
    itemsSectionIndex >= 0 && isRecord(currentSections[itemsSectionIndex])
      ? (currentSections[itemsSectionIndex] as Record<string, unknown>)
      : null;

  const prevItemsData = isRecord(itemsSection?.data)
    ? (itemsSection?.data as Record<string, unknown>)
    : {};

  const nextItemsData: Record<string, unknown> = {
    ...prevItemsData,
    items:
      nextItems ??
      (Array.isArray(prevItemsData.items) ? prevItemsData.items : []),
    source: {
      type: result.data.itemsSource,
      invoiceTemplateId:
        result.data.itemsSource === "invoice-template"
          ? result.data.invoiceTemplateId || null
          : null,
    },
  };

  const nextItemsSection: Record<string, unknown> = {
    ...(itemsSection ?? {}),
    id: "checkout-items",
    type: "checkout-items",
    data: nextItemsData,
  };

  const nextSections = [...currentSections];
  if (headerSectionIndex >= 0)
    nextSections[headerSectionIndex] = nextHeaderSection;
  else nextSections.unshift(nextHeaderSection);

  if (itemsSectionIndex >= 0)
    nextSections[itemsSectionIndex] = nextItemsSection;
  else nextSections.push(nextItemsSection);

  const nextGlobalStyles = isRecord(checkoutPage.globalStyles)
    ? { ...(checkoutPage.globalStyles as Record<string, unknown>) }
    : {};
  nextGlobalStyles.layout = result.data.layout;

  const updated = await updateCheckoutPageInDatabase({
    checkoutPageId: params.checkoutPageId,
    organizationId: organization.id,
    data: {
      allowedCurrencies: result.data.allowedCurrencies,
      defaultCurrency: result.data.defaultCurrency,
      description: result.data.description || null,
      expiresAt: parsedExpiresAt,
      isActive: result.data.isActive,
      isPasswordProtected: result.data.isPasswordProtected,
      ...(passwordHash ? { passwordHash } : {}),
      passwordHint: result.data.passwordHint || null,
      paymentProviders: result.data.paymentProviders,
      globalStyles: nextGlobalStyles as unknown as Prisma.InputJsonValue,
      sections: nextSections as unknown as Prisma.InputJsonValue,
      ...(normalizedReceiptTemplateId
        ? { receiptTemplate: { connect: { id: normalizedReceiptTemplateId } } }
        : { receiptTemplate: { disconnect: true } }),
      name: result.data.name,
    },
  });

  return data({ success: Boolean(updated) }, { headers });
}

export default function CheckoutPageEditRoute({
  loaderData,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const { checkoutPage, invoiceTemplates, organizationSlug, receiptTemplates } =
    loaderData;

  const publicUrl =
    typeof window === "undefined"
      ? `/checkout/${checkoutPage.slug}`
      : `${window.location.origin}/checkout/${checkoutPage.slug}`;

  const [providerStripe, setProviderStripe] = React.useState(
    checkoutPage.paymentProviders.includes("stripe"),
  );
  const [providerPaystack, setProviderPaystack] = React.useState(
    checkoutPage.paymentProviders.includes("paystack"),
  );
  const [isActive, setIsActive] = React.useState(checkoutPage.isActive);
  const [isPasswordProtected, setIsPasswordProtected] = React.useState(
    checkoutPage.isPasswordProtected,
  );
  const [receiptTemplateId, setReceiptTemplateId] = React.useState(
    checkoutPage.receiptTemplateId ?? "__none__",
  );

  const paymentProviders = [
    providerStripe ? "stripe" : null,
    providerPaystack ? "paystack" : null,
  ].filter(Boolean) as string[];

  const allowedCurrencies = Array.isArray(checkoutPage.allowedCurrencies)
    ? checkoutPage.allowedCurrencies.join(",")
    : "USD";

  const parsed = parseCheckoutSections(
    checkoutPage.sections,
    checkoutPage.globalStyles,
    {
      storeName: checkoutPage.name,
      defaultCurrency: checkoutPage.defaultCurrency,
      allowedCurrencies: checkoutPage.allowedCurrencies,
    },
  );

  const invoiceSource = (() => {
    const sections = Array.isArray(checkoutPage.sections)
      ? (checkoutPage.sections as unknown[])
      : [];
    const itemsSection = sections.find(
      (s) =>
        typeof s === "object" &&
        s !== null &&
        !Array.isArray(s) &&
        ("type" in s
          ? (s as { type?: unknown }).type === "checkout-items"
          : false),
    ) as unknown;

    const data =
      typeof itemsSection === "object" &&
      itemsSection !== null &&
      !Array.isArray(itemsSection) &&
      "data" in itemsSection &&
      typeof (itemsSection as { data?: unknown }).data === "object" &&
      (itemsSection as { data?: unknown }).data !== null
        ? ((itemsSection as { data?: unknown }).data as Record<string, unknown>)
        : null;

    const source =
      data && typeof data.source === "object" && data.source !== null
        ? (data.source as Record<string, unknown>)
        : null;

    const type = typeof source?.type === "string" ? source.type : null;
    const invoiceTemplateId =
      typeof source?.invoiceTemplateId === "string"
        ? source.invoiceTemplateId
        : null;

    return { type, invoiceTemplateId };
  })();

  const [layout, setLayout] = React.useState<
    "centered-card" | "split" | "minimal"
  >(parsed.layout);
  const [headerLogoUrl, setHeaderLogoUrl] = React.useState(
    parsed.header.storeLogo ?? "",
  );
  const [headerBackgroundColor, setHeaderBackgroundColor] = React.useState(
    parsed.header.backgroundColor ?? "#ffffff",
  );
  const [headerTextColor, setHeaderTextColor] = React.useState(
    parsed.header.textColor ?? "#000000",
  );
  const [itemsSource, setItemsSource] = React.useState<
    "manual" | "invoice-template"
  >(invoiceSource.type === "invoice-template" ? "invoice-template" : "manual");
  const [invoiceTemplateId, setInvoiceTemplateId] = React.useState(
    invoiceSource.invoiceTemplateId ?? "",
  );
  const [manualItems, setManualItems] = React.useState<
    Array<{
      id: string;
      description: string;
      quantity: string;
      unitPrice: string;
      total: string;
    }>
  >(() => {
    const existing = Array.isArray(parsed.items) ? parsed.items : [];
    if (existing.length === 0) {
      return [
        {
          id: crypto.randomUUID(),
          description: "",
          quantity: "1",
          unitPrice: "0.00",
          total: "0.00",
        },
      ];
    }
    return existing.map((i) => ({
      id: crypto.randomUUID(),
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.total,
    }));
  });

  const removeManualItem = React.useCallback((id: string) => {
    setManualItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((p) => p.id !== id),
    );
  }, []);

  const updateManualItem = React.useCallback(
    (
      idx: number,
      patch: Partial<{
        description: string;
        quantity: string;
        unitPrice: string;
      }>,
    ) => {
      setManualItems((prev) =>
        prev.map((p, i) => {
          if (i !== idx) return p;
          const next = { ...p, ...patch };
          return {
            ...next,
            total: calcLineTotal({
              quantity: next.quantity,
              unitPrice: next.unitPrice,
            }),
          };
        }),
      );
    },
    [],
  );

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

  const generateTemplatePreview = React.useCallback(
    async ({
      templateId,
      setGenerating,
      setUrl,
    }: {
      templateId: string;
      setGenerating: (v: boolean) => void;
      setUrl: (v: string | null) => void;
    }) => {
      setGenerating(true);
      setUrl(null);
      try {
        const response = await fetch(
          `/organizations/${organizationSlug}/templates/${templateId}/preview`,
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
            errorData.message ||
              errorData.error ||
              "Failed to generate preview",
          );
        }

        const html = await response.text();
        if (!html || html.trim().length === 0) {
          throw new Error("Received empty response from server");
        }

        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        setUrl(url);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to generate preview. Please try again.";
        alert(errorMessage);
      } finally {
        setGenerating(false);
      }
    },
    [organizationSlug],
  );

  const onReceiptPreviewOpenChange = (open: boolean) => {
    if (!open && receiptPreviewUrl) {
      URL.revokeObjectURL(receiptPreviewUrl);
      setReceiptPreviewUrl(null);
    }
    setReceiptPreviewOpen(open);
  };

  const onInvoicePreviewOpenChange = (open: boolean) => {
    if (!open && invoicePreviewUrl) {
      URL.revokeObjectURL(invoicePreviewUrl);
      setInvoicePreviewUrl(null);
    }
    setInvoicePreviewOpen(open);
  };

  React.useEffect(() => {
    if (itemsSource !== "invoice-template") {
      setInvoiceTemplateId("");
    }
  }, [itemsSource]);

  React.useEffect(() => {
    if (
      receiptPreviewOpen &&
      receiptTemplateId &&
      receiptTemplateId !== "__none__" &&
      !receiptPreviewUrl &&
      !receiptPreviewGenerating
    ) {
      void generateTemplatePreview({
        templateId: receiptTemplateId,
        setGenerating: setReceiptPreviewGenerating,
        setUrl: setReceiptPreviewUrl,
      });
    }
  }, [
    generateTemplatePreview,
    receiptPreviewGenerating,
    receiptPreviewOpen,
    receiptPreviewUrl,
    receiptTemplateId,
  ]);

  React.useEffect(() => {
    if (
      invoicePreviewOpen &&
      invoiceSource.invoiceTemplateId &&
      !invoicePreviewUrl &&
      !invoicePreviewGenerating
    ) {
      void generateTemplatePreview({
        templateId: invoiceSource.invoiceTemplateId,
        setGenerating: setInvoicePreviewGenerating,
        setUrl: setInvoicePreviewUrl,
      });
    }
  }, [
    generateTemplatePreview,
    invoicePreviewGenerating,
    invoicePreviewOpen,
    invoicePreviewUrl,
    invoiceSource.invoiceTemplateId,
  ]);

  React.useEffect(() => {
    return () => {
      if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
      if (invoicePreviewUrl) URL.revokeObjectURL(invoicePreviewUrl);
    };
  }, [invoicePreviewUrl, receiptPreviewUrl]);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          onClick={() =>
            navigate(`/organizations/${organizationSlug}/checkout-pages`)
          }
          size="icon"
          variant="ghost"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold truncate">
            {checkoutPage.name}
          </h1>
          <p className="text-muted-foreground text-sm truncate">
            Public URL: {publicUrl}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={async () => {
              await navigator.clipboard.writeText(publicUrl);
            }}
            variant="outline"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy link
          </Button>
          <Button asChild variant="outline">
            <a href={publicUrl} rel="noreferrer" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-background p-4">
          <div className="text-muted-foreground text-xs">Views</div>
          <div className="text-xl font-semibold">{checkoutPage.viewCount}</div>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <div className="text-muted-foreground text-xs">Payments</div>
          <div className="text-xl font-semibold">
            {checkoutPage.paymentCount}
          </div>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <div className="text-muted-foreground text-xs">Revenue</div>
          <div className="text-xl font-semibold">
            {formatMinorUnits({
              amountMinor: checkoutPage.totalRevenueMinor,
              currency: checkoutPage.defaultCurrency,
            })}
          </div>
        </div>
      </div>

      <form className="grid gap-6 lg:grid-cols-2" method="post">
        <input name="intent" type="hidden" value="update" />
        <div className="space-y-4">
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium">Design</h2>
                <p className="text-muted-foreground text-xs mt-1">
                  These are read from saved `sections/globalStyles`.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Layout</div>
                <Select
                  onValueChange={(v) =>
                    setLayout(v as "centered-card" | "split" | "minimal")
                  }
                  value={layout}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="centered-card">Centered card</SelectItem>
                    <SelectItem value="split">Split</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
                <input name="layout" type="hidden" value={layout} />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Header logo</div>
                <Input
                  name="headerLogoUrl"
                  onChange={(e) => setHeaderLogoUrl(e.target.value)}
                  placeholder="https://..."
                  value={headerLogoUrl}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  Header background
                </div>
                <Input
                  name="headerBackgroundColor"
                  onChange={(e) => setHeaderBackgroundColor(e.target.value)}
                  type="color"
                  value={headerBackgroundColor}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Header text</div>
                <Input
                  name="headerTextColor"
                  onChange={(e) => setHeaderTextColor(e.target.value)}
                  type="color"
                  value={headerTextColor}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <h2 className="text-sm font-medium">Products</h2>
            <div className="mt-3 grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Source</div>
                  <Select
                    onValueChange={(v) =>
                      setItemsSource(v as "manual" | "invoice-template")
                    }
                    value={itemsSource}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="invoice-template">
                        Invoice template
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <input name="itemsSource" type="hidden" value={itemsSource} />
                </div>
                {itemsSource === "invoice-template" && invoiceTemplateId ? (
                  <Button
                    onClick={() => setInvoicePreviewOpen(true)}
                    type="button"
                    variant="outline"
                  >
                    Preview invoice
                  </Button>
                ) : null}
              </div>
              {itemsSource === "invoice-template" ? (
                <div className="space-y-2">
                  <Label>Invoice template</Label>
                  <Select
                    onValueChange={setInvoiceTemplateId}
                    value={invoiceTemplateId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select invoice template" />
                    </SelectTrigger>
                    <SelectContent>
                      {invoiceTemplates.map((tpl) => (
                        <SelectItem key={tpl.id} value={tpl.id}>
                          {tpl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    name="invoiceTemplateId"
                    type="hidden"
                    value={invoiceTemplateId}
                  />
                </div>
              ) : (
                <>
                  <input name="invoiceTemplateId" type="hidden" value="" />
                  <input
                    name="itemsJson"
                    type="hidden"
                    value={JSON.stringify(manualItems)}
                  />

                  <div className="space-y-3">
                    <div className="text-muted-foreground text-xs">
                      Products are fixed on the public checkout. Customers won’t
                      be able to edit them.
                    </div>
                    <div className="space-y-3">
                      {manualItems.map((item, idx) => (
                        <div
                          className="flex min-w-0 items-end gap-2 overflow-x-auto pb-0.5"
                          key={item.id}
                        >
                          <div className="min-w-32 flex-1 space-y-2">
                            <Label htmlFor={`desc-${idx}`}>Description</Label>
                            <Input
                              id={`desc-${idx}`}
                              onChange={(e) =>
                                updateManualItem(idx, {
                                  description: e.target.value,
                                })
                              }
                              value={item.description}
                            />
                          </div>
                          <div className="w-18 shrink-0 space-y-2">
                            <Label htmlFor={`qty-${idx}`}>Qty</Label>
                            <Input
                              id={`qty-${idx}`}
                              onChange={(e) =>
                                updateManualItem(idx, {
                                  quantity: e.target.value,
                                })
                              }
                              value={item.quantity}
                            />
                          </div>
                          <div className="w-26 shrink-0 space-y-2">
                            <Label htmlFor={`unit-${idx}`}>Unit</Label>
                            <Input
                              id={`unit-${idx}`}
                              onChange={(e) =>
                                updateManualItem(idx, {
                                  unitPrice: e.target.value,
                                })
                              }
                              value={item.unitPrice}
                            />
                          </div>
                          <div className="shrink-0">
                            <Button
                              aria-label="Delete row"
                              disabled={manualItems.length <= 1}
                              onClick={() => removeManualItem(item.id)}
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-4 border-t pt-3">
                      <div className="text-sm font-medium">
                        Overall total:{" "}
                        {manualItems
                          .reduce(
                            (sum, i) =>
                              sum +
                              (Number(i.quantity) || 0) *
                                (Number(i.unitPrice) || 0),
                            0,
                          )
                          .toFixed(2)}
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
                                total: calcLineTotal({
                                  quantity: "1",
                                  unitPrice: "0.00",
                                }),
                              },
                            ])
                          }
                          type="button"
                          variant="outline"
                        >
                          Add product
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-background p-4 space-y-6">
            <h2 className="text-sm font-medium">Other settings</h2>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input defaultValue={checkoutPage.name} id="name" name="name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                defaultValue={checkoutPage.description ?? ""}
                id="description"
                name="description"
              />
            </div>

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
                  <SelectItem value="__none__">None</SelectItem>
                  {receiptTemplates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                name="receiptTemplateId"
                type="hidden"
                value={
                  receiptTemplateId === "__none__" ? "" : receiptTemplateId
                }
              />
              <div className="pt-1">
                <Button
                  disabled={
                    !receiptTemplateId || receiptTemplateId === "__none__"
                  }
                  onClick={() => setReceiptPreviewOpen(true)}
                  type="button"
                  variant="outline"
                >
                  Preview receipt
                </Button>
              </div>
            </div>

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
              <input
                name="paymentProviders"
                type="hidden"
                value={paymentProviders.join(",")}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">Default currency</Label>
                <Input
                  defaultValue={checkoutPage.defaultCurrency}
                  id="defaultCurrency"
                  name="defaultCurrency"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allowedCurrencies">Allowed currencies</Label>
                <Input
                  defaultValue={allowedCurrencies}
                  id="allowedCurrencies"
                  name="allowedCurrencies"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isActive}
                  id="isActive"
                  onCheckedChange={(v) => setIsActive(Boolean(v))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <input
                name="isActive"
                type="hidden"
                value={isActive ? "on" : ""}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isPasswordProtected}
                  id="isPasswordProtected"
                  onCheckedChange={(v) => setIsPasswordProtected(Boolean(v))}
                />
                <Label htmlFor="isPasswordProtected">Password protection</Label>
              </div>
              <input
                name="isPasswordProtected"
                type="hidden"
                value={isPasswordProtected ? "on" : ""}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">New password (optional)</Label>
                  <Input id="password" name="password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordHint">Password hint</Label>
                  <Input
                    defaultValue={checkoutPage.passwordHint ?? ""}
                    id="passwordHint"
                    name="passwordHint"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expires at (optional)</Label>
              <Input
                defaultValue={
                  checkoutPage.expiresAt
                    ? new Date(checkoutPage.expiresAt)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium">Saved preview</h2>
          </div>
          <div className="mt-4">
            <CheckoutPageRenderer
              checkoutPageSlug={checkoutPage.slug}
              description={checkoutPage.description ?? undefined}
              header={{
                backgroundColor: headerBackgroundColor,
                storeLogo: headerLogoUrl.length > 0 ? headerLogoUrl : null,
                storeName: parsed.header.storeName,
                textColor: headerTextColor,
              }}
              layout={layout}
              pageName={checkoutPage.name}
              paymentForm={parsed.paymentForm}
              paymentProviders={checkoutPage.paymentProviders}
              previewMode
              products={
                itemsSource === "manual"
                  ? manualItems.map((item) => ({
                      description: item.description,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice,
                      total: item.total,
                    }))
                  : parsed.items
              }
            />
          </div>
        </div>
        <div className="lg:col-span-2 flex items-center justify-end gap-2">
          <Button type="submit">Save</Button>
        </div>
      </form>

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
    </div>
  );
}
