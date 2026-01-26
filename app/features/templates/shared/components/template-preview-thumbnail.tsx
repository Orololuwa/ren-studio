import { useCallback, useEffect, useRef, useState } from "react";

import type { Template } from "../types";

interface TemplatePreviewThumbnailProps {
  organizationSlug: string;
  template: Template;
}

export function TemplatePreviewThumbnail({
  organizationSlug,
  template,
}: TemplatePreviewThumbnailProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(false);

  const handleGeneratePreview = useCallback(async () => {
    if (!template || isGenerating || previewUrl) return;

    setIsGenerating(true);
    setHasError(false);

    // Extract section data and create sections object keyed by section ID
    const sectionsData: Record<string, Record<string, unknown>> = {};
    template.sections.forEach((section) => {
      sectionsData[section.id] = section.data;
    });

    try {
      const response = await fetch(
        `/organizations/${organizationSlug}/templates/${template.id}/preview`,
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
      setHasError(true);
    } finally {
      setIsGenerating(false);
    }
  }, [template, organizationSlug, isGenerating, previewUrl]);

  // Lazy load preview when card becomes visible
  useEffect(() => {
    if (!containerRef.current || isVisibleRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisibleRef.current) {
            isVisibleRef.current = true;
            handleGeneratePreview();
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px", // Start loading slightly before card is visible
        threshold: 0.1,
      },
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [handleGeneratePreview]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div
      className="bg-muted/50 aspect-4/3 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative"
      ref={containerRef}
    >
      {previewUrl && !hasError ? (
        <div className="w-full h-full relative overflow-hidden">
          <iframe
            className="absolute top-0 left-0 border-0 pointer-events-none"
            src={previewUrl}
            style={{
              width: "400%",
              height: "400%",
              transform: "scale(0.25)",
              transformOrigin: "top left",
            }}
            title={`${template.name} Preview`}
          />
        </div>
      ) : hasError ? (
        <div className="text-center p-4">
          <span className="text-muted-foreground text-sm">
            {template.name} Preview
          </span>
        </div>
      ) : isGenerating ? (
        <div className="text-center p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-2 bg-muted-foreground/20 rounded w-3/4 mx-auto" />
            <div className="h-2 bg-muted-foreground/20 rounded w-1/2 mx-auto" />
            <div className="h-2 bg-muted-foreground/20 rounded w-2/3 mx-auto" />
          </div>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">
          {template.name} Preview
        </span>
      )}
    </div>
  );
}
