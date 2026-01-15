import { Palette } from "lucide-react";
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with external changes
  useEffect(() => {
    setLocalColor(initialColor);
  }, [initialColor]);

  const handleChange = (newColor: string) => {
    setLocalColor(newColor);

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the store update
    debounceRef.current = setTimeout(() => {
      onColorChange(index, newColor);
    }, 1000);
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
        onChange={(e) => handleChange(e.target.value)}
        type="color"
        value={localColor}
      />
      <Input
        className="flex-1"
        id={`palette-${index}-hex`}
        onChange={(e) => {
          const hexValue = e.target.value;
          if (/^#[0-9A-Fa-f]{6}$/.test(hexValue)) {
            handleChange(hexValue);
          }
        }}
        placeholder="#000000"
        type="text"
        value={localColor}
      />
    </div>
  );
}

export function ColorPaletteEditor() {
  const { currentTemplate, updateColorPalette } = useBuilderStore();
  const [open, setOpen] = useState(false);

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
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Palette className="h-4 w-4 mr-2" />
          Colors
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Color Palette</DialogTitle>
          <DialogDescription>
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
