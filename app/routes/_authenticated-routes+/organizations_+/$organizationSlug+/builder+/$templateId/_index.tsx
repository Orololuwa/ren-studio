import type { DragStartEvent } from "@dnd-kit/core";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import {
  data,
  href,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import { z } from "zod";

import type { Route } from "../$templateId/+types/_index";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  retrieveTemplateFromDatabaseById,
  saveTemplateToDatabase,
} from "~/features/builder/shared/builder-model.server";
import { ColorPaletteEditor } from "~/features/builder/shared/components/color-palette-editor";
import { ComponentPalette } from "~/features/builder/shared/components/component-palette";
import { ExportButton } from "~/features/builder/shared/components/export-button";
import { PreviewModal } from "~/features/builder/shared/components/preview-modal";
import { PropertiesPanel } from "~/features/builder/shared/components/properties-panel";
import { TemplateCanvas } from "~/features/builder/shared/components/template-canvas";
import { useBuilderStore } from "~/features/builder/shared/store/builder-store";
import { getTemplateById } from "~/features/builder/shared/templates";
import type {
  Template,
  TemplateSection,
} from "~/features/builder/shared/types";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";
import { createToastHeaders } from "~/utils/toast.server";
import { validateFormData } from "~/utils/validate-form-data.server";

const saveTemplateSchema = z.object({
  globalStyles: z
    .union([z.record(z.string(), z.string()), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        return JSON.parse(val) as Record<string, string>;
      }
      return val;
    }),
  intent: z.literal("save"),
  name: z.string(),
  sections: z.union([z.array(z.any()), z.string()]).transform((val) => {
    if (typeof val === "string") {
      return JSON.parse(val) as unknown[];
    }
    return val;
  }),
  templateId: z.string().optional(),
  type: z.enum([
    "resume",
    "invoice",
    "certificate",
    "report-cards",
    "quote",
    "proposal",
    "contract",
    "purchase-order",
    "receipt",
    "estimate",
    "statement",
    "letter",
    "form",
    "label",
  ]),
  colorPalette: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (typeof val === "string") {
        return JSON.parse(val) as string[];
      }
      return val;
    }),
});

const actionSchema = saveTemplateSchema;

// Helper function to get currency symbol from currency code
function getCurrencySymbol(currencyCode: string): string {
  try {
    // Try with en-US first
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const parts = formatter.formatToParts(0);
    const symbolPart = parts.find((part) => part.type === "currency");

    // If we got a symbol (not the code), return it
    if (symbolPart && symbolPart.value !== currencyCode) {
      return symbolPart.value;
    }

    // Fallback: try with locale specific to the currency
    const localeMap: Record<string, string> = {
      NGN: "en-NG", // Nigerian English
      ZAR: "en-ZA", // South African English
      EGP: "ar-EG", // Egyptian Arabic
      KES: "en-KE", // Kenyan English
      GHS: "en-GH", // Ghanaian English
      TZS: "en-TZ", // Tanzanian English
      UGX: "en-UG", // Ugandan English
      ETB: "en-ET", // Ethiopian English
      MAD: "ar-MA", // Moroccan Arabic
    };

    const preferredLocale = localeMap[currencyCode];
    if (preferredLocale) {
      try {
        const altFormatter = new Intl.NumberFormat(preferredLocale, {
          style: "currency",
          currency: currencyCode,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
        const altParts = altFormatter.formatToParts(0);
        const altSymbolPart = altParts.find((part) => part.type === "currency");
        if (altSymbolPart && altSymbolPart.value !== currencyCode) {
          return altSymbolPart.value;
        }
      } catch {
        // Continue to fallback
      }
    }

    // Final fallback: return currency code
    return currencyCode;
  } catch {
    // Fallback to currency code if formatting fails
    return currencyCode;
  }
}

const COMMON_CURRENCIES = [
  { code: "USD", name: "US Dollar ($)" },
  { code: "EUR", name: "Euro (€)" },
  { code: "GBP", name: "British Pound (£)" },
  { code: "JPY", name: "Japanese Yen (¥)" },
  { code: "CAD", name: "Canadian Dollar (C$)" },
  { code: "AUD", name: "Australian Dollar (A$)" },
  { code: "CHF", name: "Swiss Franc (CHF)" },
  { code: "CNY", name: "Chinese Yuan (¥)" },
  { code: "INR", name: "Indian Rupee (₹)" },
  { code: "BRL", name: "Brazilian Real (R$)" },
  { code: "MXN", name: "Mexican Peso (MX$)" },
  { code: "SGD", name: "Singapore Dollar (S$)" },
  { code: "HKD", name: "Hong Kong Dollar (HK$)" },
  { code: "NZD", name: "New Zealand Dollar (NZ$)" },
  { code: "SEK", name: "Swedish Krona (kr)" },
  { code: "NOK", name: "Norwegian Krone (kr)" },
  { code: "DKK", name: "Danish Krone (kr)" },
  { code: "PLN", name: "Polish Zloty (zł)" },
  { code: "RUB", name: "Russian Ruble (₽)" },
  { code: "NGN", name: "Nigerian Naira (₦)" },
  { code: "ZAR", name: "South African Rand (R)" },
  { code: "EGP", name: "Egyptian Pound (E£)" },
  { code: "KES", name: "Kenyan Shilling (KSh)" },
  { code: "GHS", name: "Ghanaian Cedi (₵)" },
  { code: "TZS", name: "Tanzanian Shilling (TSh)" },
  { code: "UGX", name: "Ugandan Shilling (USh)" },
  { code: "ETB", name: "Ethiopian Birr (Br)" },
  { code: "MAD", name: "Moroccan Dirham (د.م.)" },
  { code: "XOF", name: "West African CFA Franc (CFA)" },
  { code: "XAF", name: "Central African CFA Franc (FCFA)" },
] as const;

export async function loader({ params, context }: Route.LoaderArgs) {
  const { organization } = context.get(organizationMembershipContext);
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);
  const typedParams = params as {
    organizationSlug: string;
    templateId: string;
  };

  // Try to fetch from database first
  let template: Template | null = null;
  try {
    template = await retrieveTemplateFromDatabaseById({
      organizationId: organization.id,
      templateId: typedParams.templateId,
    });
  } catch {
    // If not found in database, fall back to predefined templates
  }

  // Fallback to predefined templates if not found in database
  if (!template) {
    template = getTemplateById(typedParams.templateId) || null;
  }

  return {
    breadcrumb: {
      title: t("organizations:builder.breadcrumb"),
      to: href("/organizations/:organizationSlug/builder/:templateId", {
        organizationSlug: typedParams.organizationSlug,
        templateId: typedParams.templateId,
      }),
    },
    organizationSlug: typedParams.organizationSlug,
    pageTitle: getPageTitle(t, "organizations:builder.pageTitle"),
    template,
    templateId: typedParams.templateId,
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const { organization, headers } = context.get(organizationMembershipContext);

  const result = await validateFormData(request, actionSchema);

  if (!result.success) {
    console.error("Validation failed:", result.response);
    return result.response;
  }

  const { data: body } = result;

  switch (body.intent) {
    case "save": {
      const template: Omit<Template, "createdAt" | "updatedAt"> = {
        colorPalette: body.colorPalette || [],
        globalStyles: body.globalStyles as Record<string, string>,
        id: body.templateId || "",
        name: body.name,
        organizationId: organization.id,
        sections: body.sections as TemplateSection[],
        type: body.type,
      };

      const savedTemplate = await saveTemplateToDatabase({
        organizationId: organization.id,
        template,
      });

      const toastHeaders = await createToastHeaders({
        description: "Your template has been saved successfully.",
        title: "Template saved",
      });

      return data(
        { success: true, template: savedTemplate },
        {
          headers: {
            ...Object.fromEntries(headers),
            ...Object.fromEntries(toastHeaders),
          },
        },
      );
    }
  }
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export default function BuilderEditorRoute({
  loaderData,
}: Route.ComponentProps) {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [templateNotFound, setTemplateNotFound] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const {
    currentTemplate,
    setCurrentTemplate,
    selectSection,
    selectedSectionId,
    updateGlobalStyles,
  } = useBuilderStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  // Use params directly to ensure we get the latest templateId from the URL
  const templateId = params.templateId;
  const organizationSlug =
    params.organizationSlug || loaderData.organizationSlug;

  // Load template on mount from loader data (database or predefined)
  useEffect(() => {
    if (!templateId) return;

    // Use template from loader data
    const template = loaderData.template;

    if (template) {
      // Check sessionStorage for saved currency preference for this template
      const storageKey = `template-currency-${templateId}`;
      const savedCurrency =
        typeof window !== "undefined"
          ? sessionStorage.getItem(storageKey)
          : null;

      // Determine currency: prioritize template's saved currency, then sessionStorage, then default
      let currencyToUse: string | undefined = template.globalStyles.currency as
        | string
        | undefined;

      if (
        (template.type === "invoice" || template.type === "receipt") &&
        !currencyToUse
      ) {
        currencyToUse = savedCurrency || "USD";
      }

      // Sync template currency to sessionStorage if it exists
      if (
        currencyToUse &&
        currencyToUse !== savedCurrency &&
        typeof window !== "undefined"
      ) {
        sessionStorage.setItem(storageKey, currencyToUse);
      }

      // Ensure organizationId is set correctly
      const editableTemplate = {
        ...template,
        organizationId: organizationSlug || "",
        // Set currency if determined
        globalStyles: {
          ...template.globalStyles,
          ...(currencyToUse ? { currency: currencyToUse } : {}),
        },
      };
      setCurrentTemplate(editableTemplate);
      selectSection(null); // Reset selected section when loading new template
      setTemplateNotFound(false);
    } else {
      setTemplateNotFound(true);
    }
  }, [
    templateId,
    organizationSlug,
    loaderData.template,
    setCurrentTemplate,
    selectSection,
  ]);

  if (templateNotFound) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Template Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The template with ID "{templateId}" could not be found.
          </p>
          <Button
            onClick={() => {
              // Preserve search params when navigating back
              const searchString = searchParams.toString();
              const backUrl = `/organizations/${organizationSlug}/builder${
                searchString ? `?${searchString}` : ""
              }`;
              navigate(backUrl);
            }}
            variant="outline"
          >
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  if (!currentTemplate) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading template...</p>
        </div>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  return (
    <DndContext onDragStart={handleDragStart} sensors={sensors}>
      <div className="flex flex-1 max-h-[calc(100vh-4rem)] overflow-hidden select-none">
        {/* Canvas on the left */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b p-4 flex items-center justify-between bg-background">
            <div className="flex items-center gap-3">
              <Button
                className="h-8 w-8"
                onClick={() => {
                  // Preserve search params when navigating back
                  const searchString = searchParams.toString();
                  const backUrl = `/organizations/${organizationSlug}/builder${
                    searchString ? `?${searchString}` : ""
                  }`;
                  navigate(backUrl);
                }}
                size="icon"
                variant="ghost"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Go back</span>
              </Button>
              <h2
                className="text-lg font-semibold"
                data-testid="template-editor-title"
              >
                {currentTemplate?.name || "Untitled Template"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {(currentTemplate?.type === "invoice" ||
                currentTemplate?.type === "receipt") && (
                <Popover onOpenChange={setCurrencyOpen} open={currencyOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      aria-expanded={currencyOpen}
                      className="w-[180px] justify-between"
                      role="combobox"
                      variant="outline"
                    >
                      {currentTemplate?.globalStyles.currency
                        ? (() => {
                            const currencyCode = currentTemplate?.globalStyles
                              .currency as string;
                            const symbol = getCurrencySymbol(currencyCode);
                            // Only show code if symbol is different from code
                            return symbol !== currencyCode
                              ? `${symbol} ${currencyCode}`
                              : currencyCode;
                          })()
                        : "Select currency"}
                      <svg
                        aria-hidden="true"
                        className="ml-2 h-4 w-4 shrink-0 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[180px] p-0">
                    <Command>
                      <CommandInput placeholder="Search currency..." />
                      <CommandList>
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup>
                          {COMMON_CURRENCIES.map((currency) => (
                            <CommandItem
                              key={currency.code}
                              onSelect={() => {
                                const currencyCode = currency.code;
                                updateGlobalStyles({ currency: currencyCode });
                                // Save to sessionStorage for persistence
                                if (
                                  templateId &&
                                  typeof window !== "undefined"
                                ) {
                                  sessionStorage.setItem(
                                    `template-currency-${templateId}`,
                                    currencyCode,
                                  );
                                }
                                setCurrencyOpen(false);
                              }}
                              value={`${currency.code} ${currency.name}`}
                            >
                              <svg
                                aria-hidden="true"
                                className={`mr-2 h-4 w-4 ${
                                  (
                                    currentTemplate?.globalStyles
                                      .currency as string
                                  ) === currency.code
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                              {currency.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              <ColorPaletteEditor />
              <Button
                data-testid="preview-button"
                onClick={() => setPreviewOpen(true)}
                variant="outline"
              >
                Preview
              </Button>
              <ExportButton />
            </div>
          </div>
          <TemplateCanvas />
        </div>

        {/* Side panel on the right - switches between ComponentPalette and PropertiesPanel */}
        {selectedSectionId ? (
          <PropertiesPanel />
        ) : (
          <ComponentPalette
            initialTemplateType={
              currentTemplate?.type || loaderData.template?.type
            }
          />
        )}

        <PreviewModal onOpenChange={setPreviewOpen} open={previewOpen} />
      </div>
      <DragOverlay>
        {activeId ? (
          <div className="p-3 border-2 border-primary rounded-lg bg-background opacity-80 shadow-xl">
            <span className="font-medium text-sm">Dragging...</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
