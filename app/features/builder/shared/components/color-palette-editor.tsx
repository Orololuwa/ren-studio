import { Palette } from "lucide-react";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";

import { useBuilderStore } from "../store/builder-store";
import { resolveColorReference } from "../utils/color-resolver";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface ColorInputProps {
  index: number;
  initialColor: string;
  onColorChange: (index: number, color: string) => void;
}

function ColorInput({ index, initialColor, onColorChange }: ColorInputProps) {
  const [localColor, setLocalColor] = useState(initialColor);
  const [hexInput, setHexInput] = useState(initialColor);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with external changes
  useEffect(() => {
    setLocalColor(initialColor);
    setHexInput(initialColor);
  }, [initialColor]);

  const handleColorPickerChange = (newColor: string) => {
    setLocalColor(newColor);
    setHexInput(newColor);

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the store update
    debounceRef.current = setTimeout(() => {
      onColorChange(index, newColor);
    }, 1000);
  };

  const handleHexInputChange = (hexValue: string) => {
    // Allow partial input - update the display immediately
    setHexInput(hexValue);

    // Only update the color picker and store if it's a valid hex code
    if (/^#[0-9A-Fa-f]{0,6}$/i.test(hexValue)) {
      // If it's a complete valid hex code, update the color
      if (/^#[0-9A-Fa-f]{6}$/i.test(hexValue)) {
        setLocalColor(hexValue);

        // Clear existing debounce
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }

        // Debounce the store update
        debounceRef.current = setTimeout(() => {
          onColorChange(index, hexValue);
        }, 1000);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-2 mt-1">
      <Input
        className="h-10 w-20"
        id={`palette-${index}`}
        onChange={(e) => handleColorPickerChange(e.target.value)}
        type="color"
        value={localColor}
      />
      <Input
        className="flex-1"
        data-testid={`palette-input-${index}`}
        id={`palette-${index}-hex`}
        onBlur={(e) => {
          // On blur, if the value is invalid or incomplete, reset to the last valid color
          const value = e.target.value;
          if (!/^#[0-9A-Fa-f]{6}$/i.test(value)) {
            setHexInput(localColor);
          }
        }}
        onChange={(e) => handleHexInputChange(e.target.value)}
        placeholder="#000000"
        type="text"
        value={hexInput}
      />
    </div>
  );
}

export function ColorPaletteEditor({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
} = {}) {
  const { currentTemplate, updateColorPalette } = useBuilderStore();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen =
    controlledOnOpenChange !== undefined
      ? controlledOnOpenChange
      : setInternalOpen;

  if (!currentTemplate || !currentTemplate.colorPalette) {
    return null;
  }

  const colorPalette = currentTemplate.colorPalette || [];

  const handleColorChange = (index: number, newColor: string) => {
    const updatedPalette = [...colorPalette];
    updatedPalette[index] = newColor;
    updateColorPalette(updatedPalette);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            data-testid="color-palette-button"
            size="sm"
            variant="outline"
          >
            <Palette className="h-4 w-4 mr-2" />
            Colors
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Color Palette</DialogTitle>
          <DialogDescription data-testid="color-palette-description">
            Edit the template color palette. Changes will update all sections
            using these colors.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {colorPalette.map((color, colorIndex) => {
            const resolvedColor = resolveColorReference(color, colorPalette);
            const stableKey = `palette-${resolvedColor}-${colorIndex.toString()}`;
            return (
              <div className="flex items-center gap-3" key={stableKey}>
                <div className="flex-1">
                  <Label className="text-xs" htmlFor={`palette-${colorIndex}`}>
                    Color {colorIndex + 1}
                  </Label>
                  <ColorInput
                    index={colorIndex}
                    initialColor={resolvedColor}
                    onColorChange={handleColorChange}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
