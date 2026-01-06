import { DownloadIcon } from "lucide-react";

import { useBuilderStore } from "../store/builder-store";
import { Button } from "~/components/ui/button";

export function ExportButton() {
  const { currentTemplate } = useBuilderStore();

  return (
    <Button
      disabled={!currentTemplate}
      onClick={() => {
        // Export functionality will be available after Phase 11 (Puppeteer PDF Generation)
        alert(
          "Export functionality will be available after Phase 11 (Puppeteer PDF Generation)",
        );
      }}
    >
      <DownloadIcon className="w-4 h-4 mr-2" />
      Export PDF
    </Button>
  );
}
