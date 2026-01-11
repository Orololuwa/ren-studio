import { invoiceComponentLibrary } from "../../invoice/components/component-library";
import { resumeComponentLibrary } from "../../resume/components/component-library";
import type { ComponentDefinition } from "../types";

// Registry that combines all component libraries from different builder types
export const componentLibrary: Record<string, ComponentDefinition> = {
  ...resumeComponentLibrary,
  ...invoiceComponentLibrary,
  // Add more component libraries as new builder types are added
  // ...certificateComponentLibrary,
  // ...reportCardsComponentLibrary,
};
