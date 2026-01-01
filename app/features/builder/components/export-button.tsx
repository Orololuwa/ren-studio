import { Button } from "~/components/ui/button";
import { DownloadIcon } from "lucide-react";
import { useBuilderStore } from "../store/builder-store";

export function ExportButton() {
  const { currentTemplate } = useBuilderStore();

  return (
    <Button
      onClick={() => {
        // Export functionality will be available after Phase 11 (Puppeteer PDF Generation)
        alert("Export functionality will be available after Phase 11 (Puppeteer PDF Generation)");
      }}
      disabled={!currentTemplate}
    >
      <DownloadIcon className="w-4 h-4 mr-2" />
      Export PDF
    </Button>
  );
}

