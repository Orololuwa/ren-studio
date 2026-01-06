import { useBuilderStore } from "../store/builder-store";
import { Button } from "~/components/ui/button";
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

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <Button disabled>Generate Preview</Button>
        </div>

        <div className="mt-4 border rounded-lg overflow-hidden p-8 text-center text-muted-foreground">
          <p>
            Preview functionality will be available after Phase 11 (Puppeteer
            PDF Generation)
          </p>
          {currentTemplate && (
            <p className="mt-2 text-sm">
              Template: {currentTemplate.name} (
              {currentTemplate.sections.length} sections)
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
