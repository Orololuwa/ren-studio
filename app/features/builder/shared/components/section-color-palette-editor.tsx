import { Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useBuilderStore } from "../store/builder-store";
import type { TemplateSection } from "../types";
import { resolveColorReference } from "../utils/color-resolver";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";

interface SectionColorInputProps {
  disabled: boolean;
  index: number;
  initialColor: string;
  onColorChange: (index: number, color: string) => void;
  sectionId: string;
}

function SectionColorInput({
  disabled,
  index,
  initialColor,
  onColorChange,
  sectionId,
}: SectionColorInputProps) {
  const [localColor, setLocalColor] = useState(initialColor);
  const [hexInput, setHexInput] = useState(initialColor);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with external changes
  useEffect(() => {
    setLocalColor(initialColor);
    setHexInput(initialColor);
  }, [initialColor]);

  const handleColorPickerChange = (newColor: string) => {
    if (disabled) return;

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
    if (disabled) return;

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
        disabled={disabled}
        id={`section-palette-${sectionId}-${index}`}
        onChange={(e) => handleColorPickerChange(e.target.value)}
        type="color"
        value={localColor}
      />
      <Input
        className="flex-1"
        disabled={disabled}
        id={`section-palette-${sectionId}-${index}-hex`}
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

interface SectionColorPaletteEditorProps {
  section: TemplateSection;
}

export function SectionColorPaletteEditor({
  section,
}: SectionColorPaletteEditorProps) {
  const { currentTemplate, updateSection } = useBuilderStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentTemplate || !currentTemplate.colorPalette) {
    return null;
  }

  const globalColorPalette = currentTemplate.colorPalette || [];
  const usingGlobalPalette = section.usingGlobalPalette !== false; // Defaults to true
  const sectionColorPalette = section.colorPalette || [...globalColorPalette]; // Fallback to global if not set

  // Get the active palette (the one currently being used)
  const activePalette = usingGlobalPalette
    ? globalColorPalette
    : sectionColorPalette;

  const handleToggle = (checked: boolean) => {
    if (checked) {
      // Switching to "Use Global Palette"
      updateSection(section.id, {
        usingGlobalPalette: true,
        // Keep section.colorPalette for potential undo
      });
    } else {
      // Switching to "Use Section Palette"
      // Copy global palette to section if section doesn't have one
      const newSectionPalette = section.colorPalette || [...globalColorPalette];
      updateSection(section.id, {
        usingGlobalPalette: false,
        colorPalette: newSectionPalette,
      });
    }
  };

  const handleColorChange = (index: number, newColor: string) => {
    // If currently using global palette, switch to section palette first
    if (usingGlobalPalette) {
      const newSectionPalette = [...globalColorPalette];
      newSectionPalette[index] = newColor;
      updateSection(section.id, {
        usingGlobalPalette: false,
        colorPalette: newSectionPalette,
      });
    } else {
      // Update the section's palette
      const updatedPalette = [...sectionColorPalette];
      updatedPalette[index] = newColor;
      updateSection(section.id, {
        colorPalette: updatedPalette,
      });
    }
  };

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Color Palette</Label>
          {!usingGlobalPalette && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              Custom
            </span>
          )}
        </div>
        <Button
          className="h-6 px-2 text-xs"
          onClick={() => setIsExpanded(!isExpanded)}
          size="sm"
          variant="ghost"
        >
          {isExpanded ? "Hide" : "Show"}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={usingGlobalPalette}
            id={`palette-toggle-${section.id}`}
            onCheckedChange={handleToggle}
          />
          <Label
            className="text-xs text-muted-foreground cursor-pointer"
            htmlFor={`palette-toggle-${section.id}`}
          >
            {usingGlobalPalette ? "Use Global Palette" : "Use Section Palette"}
          </Label>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3 pt-2">
          {activePalette.map((color, index) => {
            const resolvedColor = resolveColorReference(color, activePalette);
            return (
              <div
                className="flex items-center gap-3"
                key={`section-${section.id}-palette-${index}`}
              >
                <div className="flex-1">
                  <Label
                    className="text-xs"
                    htmlFor={`section-palette-${section.id}-${index}`}
                  >
                    Color {index + 1}
                  </Label>
                  <SectionColorInput
                    disabled={usingGlobalPalette}
                    index={index}
                    initialColor={resolvedColor}
                    onColorChange={handleColorChange}
                    sectionId={section.id}
                  />
                </div>
              </div>
            );
          })}
          {usingGlobalPalette && (
            <p className="text-xs text-muted-foreground">
              Colors are inherited from the global palette. Toggle above to
              customize this section.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
