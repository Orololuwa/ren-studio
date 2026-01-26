/**
 * Color reference resolver utility
 * Resolves color palette references like "$colorPalette[0]" to actual color values
 */

const COLOR_REFERENCE_PATTERN = /\$colorPalette\[(\d+)\]/g;

/**
 * Resolves a color value that may contain color palette references
 * @param colorValue - The color value (may be a hex color or a reference like "$colorPalette[0]")
 * @param colorPalette - Array of color values in the palette
 * @returns The resolved color value (hex color)
 */
export function resolveColorReference(
  colorValue: string | undefined | null,
  colorPalette: string[] = [],
): string {
  if (!colorValue) return "";

  // If it's not a reference, return as-is
  if (!colorValue.includes("$colorPalette[")) {
    return colorValue;
  }

  // Replace all references in the string
  return colorValue.replace(COLOR_REFERENCE_PATTERN, (_, index) => {
    const paletteIndex = Number.parseInt(index, 10);
    if (
      paletteIndex >= 0 &&
      paletteIndex < colorPalette.length &&
      colorPalette[paletteIndex]
    ) {
      return colorPalette[paletteIndex];
    }
    // Fallback to original if index is invalid
    return colorValue;
  });
}

/**
 * Gets the appropriate color palette for a section
 * @param usingGlobalPalette - Whether the section uses the global palette
 * @param sectionColorPalette - Section-specific color palette (if any)
 * @param globalColorPalette - Global template color palette
 * @returns The color palette to use for this section
 */
export function getSectionColorPalette(
  usingGlobalPalette: boolean | undefined,
  sectionColorPalette: string[] | undefined,
  globalColorPalette: string[] = [],
): string[] {
  // If usingGlobalPalette is false and section has its own palette, use it
  if (usingGlobalPalette === false && sectionColorPalette) {
    return sectionColorPalette;
  }
  // Otherwise, use global palette (default behavior)
  return globalColorPalette;
}

/**
 * Resolves all color references in a styles object
 * @param styles - The styles object that may contain color references
 * @param colorPalette - Array of color values in the palette
 * @returns A new styles object with all references resolved
 */
export function resolveStyleColors(
  styles: Record<string, string | undefined>,
  colorPalette: string[] = [],
): Record<string, string> {
  const resolved: Record<string, string> = {};

  for (const [key, value] of Object.entries(styles)) {
    if (value) {
      // Only resolve color-related properties
      if (
        key.includes("color") ||
        key.includes("background") ||
        key.includes("border")
      ) {
        resolved[key] = resolveColorReference(value, colorPalette);
      } else {
        resolved[key] = value;
      }
    }
  }

  return resolved;
}

/**
 * Finds the palette index for a given color value
 * @param colorValue - The color value to find
 * @param colorPalette - Array of color values in the palette
 * @returns The index if found, or -1 if not found
 */
export function findColorPaletteIndex(
  colorValue: string | undefined | null,
  colorPalette: string[] = [],
): number {
  if (!colorValue) return -1;

  // Normalize color for comparison (remove spaces, convert to lowercase)
  const normalized = colorValue.trim().toLowerCase();

  return colorPalette.findIndex(
    (paletteColor) => paletteColor.trim().toLowerCase() === normalized,
  );
}

/**
 * Converts a color value to a palette reference if it exists in the palette
 * @param colorValue - The color value to convert
 * @param colorPalette - Array of color values in the palette
 * @returns The palette reference (e.g., "$colorPalette[0]") or the original color if not found
 */
export function convertColorToReference(
  colorValue: string | undefined | null,
  colorPalette: string[] = [],
): string {
  if (!colorValue) return "";

  const index = findColorPaletteIndex(colorValue, colorPalette);
  if (index >= 0) {
    return `$colorPalette[${index}]`;
  }

  return colorValue;
}
