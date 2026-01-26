import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";

import { useBuilderStore } from "../store/builder-store";
import { Button } from "~/components/ui/button";

export function ExportButton() {
  const { currentTemplate } = useBuilderStore();
  const params = useParams();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!currentTemplate) return;

    setIsExporting(true);

    // Extract section data and create sections object keyed by section ID
    const sectionsData: Record<string, Record<string, unknown>> = {};
    currentTemplate.sections.forEach((section) => {
      sectionsData[section.id] = section.data;
    });

    try {
      const response = await fetch(
        `/organizations/${params.organizationSlug}/templates/${params.templateId}/export`,
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
    <Button
      data-testid="export-button"
      disabled={!currentTemplate || isExporting}
      onClick={handleExport}
    >
      <DownloadIcon className="w-4 h-4 mr-2" />
      {isExporting ? "Exporting..." : "Export PDF"}
    </Button>
  );
}
