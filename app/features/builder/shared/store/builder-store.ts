import { create } from "zustand";

import type { Template, TemplateSection } from "../types";

interface BuilderState {
  currentTemplate: Template | null;
  selectedSectionId: string | null;
  isDirty: boolean;
  templateSessionId: string | null; // ID for auto-save session (the DB template ID)
  setCurrentTemplate: (template: Template) => void;
  addSection: (section: TemplateSection) => void;
  updateSection: (id: string, updates: Partial<TemplateSection>) => void;
  deleteSection: (id: string) => void;
  duplicateSection: (section: TemplateSection) => void;
  reorderSections: (sections: TemplateSection[]) => void;
  selectSection: (id: string | null) => void;
  setDirty: (dirty: boolean) => void;
  updateGlobalStyles: (updates: Partial<Record<string, string>>) => void;
  updateColorPalette: (colorPalette: string[]) => void;
  updateTemplateName: (name: string) => void;
  updateTemplateId: (id: string) => void;
  setTemplateSessionId: (id: string | null) => void;
  reset: () => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  addSection: (section) =>
    set((state) => {
      if (!state.currentTemplate) return state;
      const maxOrder = Math.max(
        ...state.currentTemplate.sections.map((s) => s.order),
        -1,
      );
      return {
        currentTemplate: {
          ...state.currentTemplate,
          sections: [
            ...state.currentTemplate.sections,
            { ...section, order: maxOrder + 1 },
          ],
        },
        isDirty: true,
      };
    }),
  currentTemplate: null,

  deleteSection: (id) =>
    set((state) => {
      if (!state.currentTemplate) return state;
      return {
        currentTemplate: {
          ...state.currentTemplate,
          sections: state.currentTemplate.sections.filter((s) => s.id !== id),
        },
        isDirty: true,
        selectedSectionId:
          state.selectedSectionId === id ? null : state.selectedSectionId,
      };
    }),

  duplicateSection: (section) =>
    set((state) => {
      if (!state.currentTemplate) return state;

      // Sort sections by order to ensure correct positioning
      const sortedSections = [...state.currentTemplate.sections].sort(
        (a, b) => a.order - b.order,
      );

      const currentIndex = sortedSections.findIndex((s) => s.id === section.id);

      if (currentIndex === -1) return state;

      const newSection: TemplateSection = {
        ...section,
        id: crypto.randomUUID(),
        order: section.order + 1,
      };

      // Insert right after the original section
      const updatedSections = [
        ...sortedSections.slice(0, currentIndex + 1),
        newSection,
        ...sortedSections.slice(currentIndex + 1),
      ].map((s, index) => ({ ...s, order: index }));

      return {
        currentTemplate: {
          ...state.currentTemplate,
          sections: updatedSections,
        },
        isDirty: true,
      };
    }),

  isDirty: false,
  templateSessionId: null,

  reorderSections: (sections) =>
    set((state) => {
      if (!state.currentTemplate) return state;
      return {
        currentTemplate: {
          ...state.currentTemplate,
          sections: sections.map((section, index) => ({
            ...section,
            order: index,
          })),
        },
        isDirty: true,
      };
    }),

  reset: () =>
    set({
      currentTemplate: null,
      isDirty: false,
      selectedSectionId: null,
      templateSessionId: null,
    }),
  selectedSectionId: null,

  selectSection: (id) => set({ selectedSectionId: id }),

  setCurrentTemplate: (template) =>
    set({ currentTemplate: template, isDirty: false }),
  setDirty: (dirty) => set({ isDirty: dirty }),

  updateGlobalStyles: (updates) =>
    set((state) => {
      if (!state.currentTemplate) return state;
      // Filter out undefined values to maintain Record<string, string> type
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined) as [
          string,
          string,
        ][],
      );
      return {
        currentTemplate: {
          ...state.currentTemplate,
          globalStyles: {
            ...state.currentTemplate.globalStyles,
            ...filteredUpdates,
          },
        },
        isDirty: true,
      };
    }),

  updateSection: (id, updates) =>
    set((state) => {
      if (!state.currentTemplate) return state;
      return {
        currentTemplate: {
          ...state.currentTemplate,
          sections: state.currentTemplate.sections.map((s) =>
            s.id === id ? { ...s, ...updates } : s,
          ),
        },
        isDirty: true,
      };
    }),

  updateColorPalette: (colorPalette) =>
    set((state) => {
      if (!state.currentTemplate) return state;
      return {
        currentTemplate: {
          ...state.currentTemplate,
          colorPalette,
        },
        isDirty: true,
      };
    }),

  updateTemplateName: (name) =>
    set((state) => {
      if (!state.currentTemplate) return state;
      return {
        currentTemplate: {
          ...state.currentTemplate,
          name,
        },
        isDirty: true,
      };
    }),

  updateTemplateId: (id) =>
    set((state) => {
      if (!state.currentTemplate) return state;
      return {
        currentTemplate: {
          ...state.currentTemplate,
          id,
        },
        templateSessionId: id,
      };
    }),

  setTemplateSessionId: (id) => set({ templateSessionId: id }),
}));
