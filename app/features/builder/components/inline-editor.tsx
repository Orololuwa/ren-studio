/* eslint-disable jsx-a11y/no-static-element-interactions */
import { useEffect, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

// Dynamically import ReactQuill only on client side to avoid SSR issues
type ReactQuillProps = {
  value: string;
  onChange: (
    value: string,
    delta?: unknown,
    source?: unknown,
    editor?: unknown,
  ) => void;
  theme: string;
  style?: React.CSSProperties;
  modules?: {
    toolbar: (
      | string[]
      | {
          list: string;
        }[]
      | {
          link: boolean;
        }[]
    )[];
  };
};

const quillOptions: ReactQuillProps["modules"] = {
  toolbar: [
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ link: true }],
  ],
};

interface InlineEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldPath?: string[];
  value: string;
  label: string;
  isRichText: boolean;
  onSave: (value: string) => void;
}

export function InlineEditor({
  open,
  onOpenChange,
  fieldPath: _fieldPath,
  value,
  label,
  isRichText,
  onSave,
}: InlineEditorProps) {
  const [editedValue, setEditedValue] = useState(value);
  const [ReactQuill, setReactQuill] =
    useState<React.ComponentType<ReactQuillProps> | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const allowCloseRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    // Dynamically import ReactQuill only on client side using ES modules
    if (typeof window !== "undefined") {
      Promise.all([
        import("react-quill-new"),
        import("react-quill-new/dist/quill.snow.css"),
      ]).then(([quillModule]) => {
        const Quill =
          quillModule.default as unknown as React.ComponentType<ReactQuillProps>;
        setReactQuill(() => Quill);
      });
    }
  }, []);

  useEffect(() => {
    setEditedValue(value);
  }, [value]);

  const handleSave = () => {
    allowCloseRef.current = true;
    onSave(editedValue);
    // Call onOpenChange directly - this will go through handleDialogOpenChange
    // but allowCloseRef.current is true, so it will proceed
    onOpenChange(false);
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    // Completely ignore any close attempts unless explicitly allowed
    if (!newOpen && !allowCloseRef.current) {
      // Prevent closing - ignore this call completely
      return;
    }
    // Only proceed if we explicitly allowed the close
    if (!newOpen) {
      allowCloseRef.current = false; // Reset for next time
    }
    onOpenChange(newOpen);
  };

  const handleCancel = () => {
    allowCloseRef.current = true;
    setEditedValue(value);
    // Call onOpenChange directly - this will go through handleDialogOpenChange
    // but allowCloseRef.current is true, so it will proceed
    onOpenChange(false);
  };

  // Don't render Dialog on server to avoid hydration issues
  if (!isMounted) {
    return null;
  }

  return (
    <Dialog modal={true} onOpenChange={handleDialogOpenChange} open={open}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        onEscapeKeyDown={() => {
          // Allow ESC to close
          allowCloseRef.current = true;
        }}
        onFocusOutside={(e) => {
          // Prevent focus outside from closing - stop the event completely
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          // Prevent ALL outside interactions from closing - stop the event completely
          e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          // Prevent ALL outside pointer events from closing - stop the event completely
          e.preventDefault();
        }}
      >
        <div
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions
          onClick={(e) => {
            // Stop all clicks inside from propagating
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            // Stop all keyboard events inside from propagating
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            // Stop all mouse events inside from propagating
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            // Stop all pointer events inside from propagating
            e.stopPropagation();
          }}
          role="presentation"
        >
          <DialogHeader>
            <DialogTitle>Edit {label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editor">{label}</Label>
              {isRichText ? (
                <div
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  {ReactQuill ? (
                    <div
                      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      role="presentation"
                    >
                      <ReactQuill
                        modules={quillOptions}
                        onChange={setEditedValue}
                        style={{ minHeight: "200px" }}
                        theme="snow"
                        value={editedValue}
                      />
                      <style>{`
                      /* Light mode - use default snow theme colors */
                      .ql-container,
                      .ql-toolbar,
                      .ql-editor {
                        pointer-events: auto !important;
                      }

                      /* Dark mode - apply dark theme */
                      .dark .ql-snow {
                        background-color: #1f2937 !important;
                        border-color: #374151 !important;
                      }
                      .dark .ql-toolbar {
                        background-color: #1f2937 !important;
                        border-color: #374151 !important;
                      }
                      .dark .ql-toolbar .ql-stroke {
                        stroke: #d1d5db !important;
                      }
                      .dark .ql-toolbar .ql-fill {
                        fill: #d1d5db !important;
                      }
                      .dark .ql-toolbar button:hover,
                      .dark .ql-toolbar button.ql-active {
                        background-color: #374151 !important;
                      }
                      .dark .ql-container {
                        background-color: #1f2937 !important;
                        border-color: #374151 !important;
                      }
                      .dark .ql-editor {
                        color: #f9fafb !important;
                        background-color: #1f2937 !important;
                      }
                      .dark .ql-editor.ql-blank::before {
                        color: #9ca3af !important;
                      }
                    `}</style>
                    </div>
                  ) : (
                    <div className="min-h-[200px] p-4 border rounded">
                      <p className="text-gray-500">Loading editor...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  <Input
                    // className="bg-white text-gray-900"
                    id="editor"
                    onChange={(e) => setEditedValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    value={editedValue}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button onClick={handleCancel} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
