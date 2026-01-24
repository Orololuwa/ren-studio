import { Check, Copy, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { useBuilderStore } from "../store/builder-store";
import { generateExamplePayload } from "../utils/generate-example-payload";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

interface CopyableSectionProps {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}

function CopyableSection({
  label,
  value,
  onCopy,
  copied,
}: CopyableSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <Button
          className="h-8 w-8"
          onClick={onCopy}
          size="icon"
          type="button"
          variant="outline"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="sr-only">Copy {label}</span>
        </Button>
      </div>
      <div className="relative">
        <pre className="max-h-[400px] overflow-auto rounded-md border bg-muted p-4 text-xs">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
}

export function ApiPayloadModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { currentTemplate } = useBuilderStore();
  const params = useParams();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Get template ID
  const templateId = currentTemplate?.id || params.templateId || "";

  // Generate current template payload
  const currentPayload = useMemo(() => {
    if (!currentTemplate) {
      return { sections: {} };
    }

    const sections: Record<string, Record<string, unknown>> = {};
    currentTemplate.sections.forEach((section) => {
      sections[section.id] = section.data;
    });

    return { sections };
  }, [currentTemplate]);

  // Generate example payload
  const examplePayload = useMemo(() => {
    if (!currentTemplate?.type) {
      return { sections: {} };
    }

    const sections = generateExamplePayload(currentTemplate.type);
    return { sections };
  }, [currentTemplate?.type]);

  // Format JSON with proper indentation
  const formatJson = (obj: unknown): string => {
    return JSON.stringify(obj, null, 2);
  };

  const handleCopy = async (text: string, sectionId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const templateIdText = templateId;
  const currentPayloadText = formatJson(currentPayload);
  const examplePayloadText = formatJson(examplePayload);

  if (!currentTemplate) {
    return (
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>API Payload Details</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            <p>No template loaded. Please load a template first.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>API Payload Details</DialogTitle>
            <Link
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              rel="noopener noreferrer"
              target="_blank"
              to="/docs"
            >
              View API Docs
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Tabs
            className="flex-1 flex flex-col min-h-0"
            defaultValue="template-id"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="template-id">Template ID</TabsTrigger>
              <TabsTrigger value="current">Current Payload</TabsTrigger>
              <TabsTrigger value="example">Example Payload</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent className="mt-0 space-y-4" value="template-id">
                <CopyableSection
                  copied={copiedSection === "template-id"}
                  label="Template ID"
                  onCopy={() => handleCopy(templateIdText, "template-id")}
                  value={templateIdText}
                />
                <div className="text-sm text-muted-foreground">
                  <p>
                    Use this template ID when making API calls to preview or
                    export this template.
                  </p>
                </div>
              </TabsContent>

              <TabsContent className="mt-0 space-y-4" value="current">
                <CopyableSection
                  copied={copiedSection === "current"}
                  label="Current Template Data"
                  onCopy={() => handleCopy(currentPayloadText, "current")}
                  value={currentPayloadText}
                />
                <div className="text-sm text-muted-foreground">
                  <p>
                    This is the current data structure of your template. Use
                    this format when making API calls with your template&apos;s
                    actual data.
                  </p>
                </div>
              </TabsContent>

              <TabsContent className="mt-0 space-y-4" value="example">
                <CopyableSection
                  copied={copiedSection === "example"}
                  label="Example Payload (All Fields)"
                  onCopy={() => handleCopy(examplePayloadText, "example")}
                  value={examplePayloadText}
                />
                <div className="text-sm text-muted-foreground">
                  <p>
                    This example shows all possible fields for all section types
                    available for this template type. Use this as a reference
                    for the complete data structure.
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
