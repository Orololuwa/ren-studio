import type { DragStartEvent } from "@dnd-kit/core";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  ArrowLeft,
  Check,
  Cloud,
  CloudOff,
  DownloadIcon,
  Eye,
  FileCode,
  Layers,
  Loader2,
  MoreVertical,
  Palette,
  Settings,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  data,
  href,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import { z } from "zod";

import type { Route } from "../$templateId/+types/_index";
import { Badge } from "~/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import {
  createTemplateInDatabase,
  retrieveTemplateFromDatabaseById,
  saveTemplateToDatabase,
} from "~/features/builder/shared/builder-model.server";
import { ApiPayloadModal } from "~/features/builder/shared/components/api-payload-modal";
import { ColorPaletteEditor } from "~/features/builder/shared/components/color-palette-editor";
import { ComponentPalette } from "~/features/builder/shared/components/component-palette";
import { InlineEditor } from "~/features/builder/shared/components/inline-editor";
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
import { cn } from "~/lib/utils";
import { getPageTitle } from "~/utils/get-page-title.server";
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

const initTemplateSchema = z.object({
  intent: z.literal("init"),
  sourceTemplateId: z.string(),
  mode: z.enum(["edit", "customize"]),
});

const actionSchema = z.discriminatedUnion("intent", [
  saveTemplateSchema,
  initTemplateSchema,
]);

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

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const { organization } = context.get(organizationMembershipContext);
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);
  const typedParams = params as {
    organizationSlug: string;
    templateId: string;
  };

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") || "edit";
  const source = url.searchParams.get("source");

  // Try to fetch from database first
  let template: Template | null = null;
  let isNewFromDefault = false;

  try {
    template = await retrieveTemplateFromDatabaseById({
      organizationId: organization.id,
      templateId: typedParams.templateId,
    });
  } catch {
    // If not found in database, fall back to predefined templates
  }

  // If mode=customize with source, we need to create a new template from source
  if (mode === "customize" && source && !template) {
    // Get source template (could be from DB or predefined)
    let sourceTemplate: Template | null = null;

    try {
      sourceTemplate = await retrieveTemplateFromDatabaseById({
        organizationId: organization.id,
        templateId: source,
      });
    } catch {
      // Try predefined
    }

    if (!sourceTemplate) {
      sourceTemplate = getTemplateById(source) || null;
    }

    if (sourceTemplate) {
      // Create a new template from the source
      template = await createTemplateInDatabase({
        colorPalette: sourceTemplate.colorPalette,
        globalStyles: sourceTemplate.globalStyles,
        name: `${sourceTemplate.name} (Copy)`,
        organizationId: organization.id,
        sections: sourceTemplate.sections,
        type: sourceTemplate.type,
      });
      isNewFromDefault = true;
    }
  }

  // Fallback to predefined templates if not found in database (for viewing only)
  if (!template && mode === "edit") {
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
    isNewFromDefault,
    mode,
    organizationSlug: typedParams.organizationSlug,
    pageTitle: getPageTitle(t, "organizations:builder.pageTitle"),
    template,
    templateId: template?.id || typedParams.templateId,
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

      return data({ success: true, template: savedTemplate }, { headers });
    }

    case "init": {
      // Handle initial template creation for customize mode
      // This is handled in the loader now, so just return success
      return data({ success: true }, { headers });
    }
  }
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

function ExportButtonMenuItem({
  currentTemplate,
  organizationSlug,
  templateId,
}: {
  currentTemplate: Template | null;
  organizationSlug: string;
  templateId: string | undefined;
}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!currentTemplate || !templateId) return;

    setIsExporting(true);

    // Extract section data and create sections object keyed by section ID
    const sectionsData: Record<string, Record<string, unknown>> = {};
    currentTemplate.sections.forEach((section) => {
      sectionsData[section.id] = section.data;
    });

    try {
      const response = await fetch(
        `/organizations/${organizationSlug}/builder/${templateId}/export`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sections: sectionsData }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to export PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentTemplate.name || "template"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenuItem
      data-testid="export-button"
      disabled={!currentTemplate || isExporting}
      onSelect={(e) => {
        e.preventDefault();
        handleExport();
      }}
    >
      <DownloadIcon className="h-4 w-4 mr-2" />
      {isExporting ? "Exporting..." : "Export PDF"}
    </DropdownMenuItem>
  );
}

export default function BuilderEditorRoute({
  loaderData,
}: Route.ComponentProps) {
  const params = useParams();
  const navigate = useNavigate();
  const [_searchParams] = useSearchParams();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [apiPayloadOpen, setApiPayloadOpen] = useState(false);
  const [templateNotFound, setTemplateNotFound] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isEditingTemplateName, setIsEditingTemplateName] = useState(false);
  const [colorPaletteOpen, setColorPaletteOpen] = useState(false);
  const [componentPaletteOpen, setComponentPaletteOpen] = useState(false);
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(false);

  const {
    currentTemplate,
    setCurrentTemplate,
    selectSection,
    selectedSectionId,
    updateGlobalStyles,
    isDirty,
    setDirty,
    setTemplateSessionId,
    templateSessionId,
    updateTemplateId,
    updateTemplateName,
  } = useBuilderStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  // Auto-save refs
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use params directly to ensure we get the latest templateId from the URL
  const templateId = params.templateId;
  const organizationSlug =
    params.organizationSlug || loaderData.organizationSlug;

  // Auto-save function
  const performSave = useCallback(async () => {
    if (!currentTemplate || !templateSessionId) return;

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setSaveStatus("saving");

    try {
      const formData = new FormData();
      formData.set("intent", "save");
      formData.set("templateId", templateSessionId);
      formData.set("name", currentTemplate.name || "Untitled Template");
      formData.set("type", currentTemplate.type || "resume");
      formData.set("sections", JSON.stringify(currentTemplate.sections || []));
      formData.set(
        "globalStyles",
        JSON.stringify(currentTemplate.globalStyles || {}),
      );
      if (currentTemplate.colorPalette) {
        formData.set(
          "colorPalette",
          JSON.stringify(currentTemplate.colorPalette),
        );
      }

      // Use pathname only to avoid duplicate requests from query params
      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (response.ok) {
        // Try to parse JSON, but don't fail if response is not JSON
        let result: { template?: { id?: string } } = {};
        try {
          const text = await response.text();
          if (text) {
            result = JSON.parse(text);
          }
        } catch {
          // Response may not be JSON (e.g., redirect response)
        }

        // Update template ID if it changed (new template created)
        if (result.template?.id && result.template.id !== templateSessionId) {
          updateTemplateId(result.template.id);
          setTemplateSessionId(result.template.id);
        }
        setSaveStatus("saved");
        setLastSavedAt(new Date());
        setDirty(false);
        // Reset to idle after 2 seconds
        setTimeout(() => {
          setSaveStatus((current) => (current === "saved" ? "idle" : current));
        }, 2000);
      } else {
        console.error(
          "Auto-save failed:",
          response.status,
          response.statusText,
        );
        setSaveStatus("error");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Auto-save error:", error);
      setSaveStatus("error");
    }
  }, [
    currentTemplate,
    templateSessionId,
    setDirty,
    updateTemplateId,
    setTemplateSessionId,
  ]);

  // Trigger auto-save when template changes
  useEffect(() => {
    if (!isDirty || !templateSessionId) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce for 1 second
    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isDirty, templateSessionId, performSave]);

  // Load template on mount from loader data
  useEffect(() => {
    if (!templateId) return;

    const template = loaderData.template;

    if (template) {
      // Determine currency for invoice/receipt types
      let currencyToUse: string | undefined = template.globalStyles.currency as
        | string
        | undefined;

      if (
        (template.type === "invoice" || template.type === "receipt") &&
        !currencyToUse
      ) {
        currencyToUse = "USD";
      }

      const editableTemplate = {
        ...template,
        organizationId: organizationSlug || "",
        globalStyles: {
          ...template.globalStyles,
          ...(currencyToUse ? { currency: currencyToUse } : {}),
        },
      };

      setCurrentTemplate(editableTemplate);
      setTemplateSessionId(template.id);
      selectSection(null);
      setTemplateNotFound(false);
      setPropertiesPanelOpen(false);
      setComponentPaletteOpen(false);

      // If it's a new template from customize, redirect to the new URL
      if (loaderData.isNewFromDefault && template.id !== templateId) {
        navigate(
          `/organizations/${organizationSlug}/builder/${template.id}?mode=edit`,
          { replace: true },
        );
      }
    } else {
      setTemplateNotFound(true);
    }
  }, [
    templateId,
    organizationSlug,
    loaderData.template,
    loaderData.isNewFromDefault,
    setCurrentTemplate,
    selectSection,
    setTemplateSessionId,
    navigate,
  ]);

  // Open properties panel sheet on mobile when section is selected
  useEffect(() => {
    if (selectedSectionId) {
      // Only open on mobile (check window width or use a media query)
      const isMobile = window.innerWidth < 768; // md breakpoint
      if (isMobile) {
        setPropertiesPanelOpen(true);
        setComponentPaletteOpen(false); // Close component palette if open
      }
    } else {
      setPropertiesPanelOpen(false);
    }
  }, [selectedSectionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Open properties panel sheet on mobile when section is selected
  useEffect(() => {
    if (selectedSectionId) {
      // Only open on mobile (check window width or use a media query)
      const isMobile = window.innerWidth < 768; // md breakpoint
      if (isMobile) {
        setPropertiesPanelOpen(true);
        setComponentPaletteOpen(false); // Close component palette if open
      }
    } else {
      setPropertiesPanelOpen(false);
    }
  }, [selectedSectionId]);

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
              navigate(`/organizations/${organizationSlug}/builder`);
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

  // Save status indicator
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <Badge
            className="gap-1"
            data-testid="save-status-badge"
            variant="secondary"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </Badge>
        );
      case "saved":
        return (
          <Badge
            className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            data-testid="save-status-badge"
            variant="secondary"
          >
            <Check className="h-3 w-3" />
            Saved
          </Badge>
        );
      case "error":
        return (
          <Badge
            className="gap-1"
            data-testid="save-status-badge"
            variant="destructive"
          >
            <CloudOff className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        if (templateSessionId) {
          return (
            <Badge
              className="gap-1 text-muted-foreground"
              data-testid="save-status-badge"
              variant="outline"
            >
              <Cloud className="h-3 w-3" />
              {lastSavedAt
                ? `Last saved ${lastSavedAt.toLocaleTimeString()}`
                : "Auto-save enabled"}
            </Badge>
          );
        }
        return null;
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} sensors={sensors}>
      <div className="flex flex-1 max-h-[calc(100vh-4rem)] overflow-hidden select-none">
        {/* Canvas on the left */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="border-b p-3 md:p-4 bg-background">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              {/* Left side: Title and save status */}
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                {/* Row 1: Back button + Title */}
                <div className="flex items-center gap-3">
                  <Button
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      navigate(`/organizations/${organizationSlug}/builder`);
                    }}
                    size="icon"
                    variant="ghost"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Go back</span>
                  </Button>
                  <h1 className="text-lg font-semibold -mx-2 -my-1 min-w-0">
                    <button
                      className="w-full text-left hover:bg-accent rounded px-2 py-1 transition-colors cursor-pointer truncate"
                      data-testid="template-editor-title"
                      onClick={() => setIsEditingTemplateName(true)}
                      type="button"
                    >
                      {currentTemplate?.name || "Untitled Template"}
                    </button>
                  </h1>
                </div>
                {/* Row 2: Auto-save status */}
                <div className="flex items-center gap-3 pl-11">
                  {renderSaveStatus()}
                </div>
              </div>

              {/* Right side: Settings and Actions dropdowns */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Settings Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      data-testid="settings-button"
                      size="sm"
                      variant="outline"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Settings</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Settings</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(currentTemplate?.type === "invoice" ||
                      currentTemplate?.type === "receipt") && (
                      <>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <span>Currency</span>
                            <span className="ml-auto text-muted-foreground">
                              {currentTemplate?.globalStyles.currency
                                ? (() => {
                                    const currencyCode = currentTemplate
                                      ?.globalStyles.currency as string;
                                    const symbol =
                                      getCurrencySymbol(currencyCode);
                                    return symbol !== currencyCode
                                      ? `${symbol} ${currencyCode}`
                                      : currencyCode;
                                  })()
                                : "Select"}
                            </span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-[200px]">
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
                                        updateGlobalStyles({
                                          currency: currencyCode,
                                        });
                                      }}
                                      value={`${currency.code} ${currency.name}`}
                                    >
                                      <svg
                                        aria-hidden="true"
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          (currentTemplate?.globalStyles
                                            .currency as string) ===
                                            currency.code
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
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
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <ColorPaletteEditor
                      onOpenChange={setColorPaletteOpen}
                      open={colorPaletteOpen}
                      trigger={
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setColorPaletteOpen(true);
                          }}
                        >
                          <Palette className="h-4 w-4 mr-2" />
                          Color Palette
                        </DropdownMenuItem>
                      }
                    />
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      data-testid="actions-button"
                      size="sm"
                      variant="outline"
                    >
                      <MoreVertical className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      data-testid="preview-button"
                      onSelect={() => setPreviewOpen(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </DropdownMenuItem>
                    <ExportButtonMenuItem
                      currentTemplate={currentTemplate}
                      organizationSlug={organizationSlug}
                      templateId={templateId}
                    />
                    <DropdownMenuItem
                      data-testid="api-payload-button"
                      onSelect={() => setApiPayloadOpen(true)}
                    >
                      <FileCode className="h-4 w-4 mr-2" />
                      API Payload Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          <TemplateCanvas />
        </div>

        {/* Side panel on the right - switches between ComponentPalette and PropertiesPanel */}
        {/* Desktop: Fixed sidebar */}
        <div className="hidden md:block">
          {selectedSectionId ? (
            <PropertiesPanel />
          ) : (
            <ComponentPalette
              initialTemplateType={
                currentTemplate?.type || loaderData.template?.type
              }
            />
          )}
        </div>

        {/* Mobile: Sheet drawer for Component Palette */}
        {!selectedSectionId && (
          <ComponentPalette
            asSheet={true}
            initialTemplateType={
              currentTemplate?.type || loaderData.template?.type
            }
            onOpenChange={setComponentPaletteOpen}
            open={componentPaletteOpen}
            trigger={
              <Button
                className="fixed bottom-4 right-4 z-50 md:hidden shadow-lg h-12 w-12 rounded-full"
                data-testid="mobile-component-palette-button"
                onClick={() => setComponentPaletteOpen(true)}
                size="icon"
              >
                <Layers className="h-5 w-5" />
                <span className="sr-only">Open components</span>
              </Button>
            }
          />
        )}

        {/* Mobile: Sheet drawer for Properties Panel */}
        {selectedSectionId && (
          <Sheet
            onOpenChange={(open) => {
              setPropertiesPanelOpen(open);
              if (!open) {
                selectSection(null);
              }
            }}
            open={propertiesPanelOpen}
          >
            <SheetContent className="w-full sm:w-80 p-0">
              <PropertiesPanel />
            </SheetContent>
          </Sheet>
        )}

        <PreviewModal onOpenChange={setPreviewOpen} open={previewOpen} />
        <ApiPayloadModal
          onOpenChange={setApiPayloadOpen}
          open={apiPayloadOpen}
        />
      </div>
      <DragOverlay>
        {activeId ? (
          <div className="p-3 border-2 border-primary rounded-lg bg-background opacity-80 shadow-xl">
            <span className="font-medium text-sm">Dragging...</span>
          </div>
        ) : null}
      </DragOverlay>
      <InlineEditor
        isRichText={false}
        label="Template Name"
        onOpenChange={setIsEditingTemplateName}
        onSave={(newName) => {
          updateTemplateName(newName);
          setIsEditingTemplateName(false);
        }}
        open={isEditingTemplateName}
        value={currentTemplate?.name || "Untitled Template"}
      />
    </DndContext>
  );
}
