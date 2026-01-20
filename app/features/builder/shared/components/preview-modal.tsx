import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";

import { useBuilderStore } from "../store/builder-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

export function PreviewModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { currentTemplate } = useBuilderStore();
  const params = useParams();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePreview = useCallback(async () => {
    if (!currentTemplate) return;

    setIsGenerating(true);
    setPreviewUrl(null);

    // Extract section data and create sections object keyed by section ID
    const sectionsData: Record<string, Record<string, unknown>> = {};
    currentTemplate.sections.forEach((section) => {
      sectionsData[section.id] = section.data;
    });

    try {
      const response = await fetch(
        `/organizations/${params.organizationSlug}/builder/${params.templateId}/preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sections: sectionsData }),
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
        // Error response
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Failed to generate preview",
        );
      }

      // Preview returns HTML, so we get the text and create a blob URL
      const html = await response.text();
      if (!html || html.trim().length === 0) {
        throw new Error("Received empty response from server");
      }

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error generating preview:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate preview. Please try again.";
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [currentTemplate, params.organizationSlug, params.templateId]);

  // Cleanup preview URL when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onOpenChange(newOpen);
  };

  // Auto-generate preview when modal opens
  useEffect(() => {
    if (open && currentTemplate && !previewUrl && !isGenerating) {
      handleGeneratePreview();
    }
  }, [open, currentTemplate, previewUrl, isGenerating, handleGeneratePreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="w-[95vw]! max-w-[210mm]! h-[90vh]! flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
        </DialogHeader>

        {previewUrl ? (
          <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
            <iframe
              className="w-full h-full border-0"
              src={previewUrl}
              title="Template Preview"
            />
          </div>
        ) : (
          <div className="mt-4 border rounded-lg overflow-hidden p-8 text-center text-muted-foreground">
            {isGenerating ? (
              <p>Generating preview...</p>
            ) : (
              <p>Loading preview...</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
