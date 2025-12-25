import { create } from "zustand";

import type { Template, TemplateSection } from "../types";

interface BuilderState {
  currentTemplate: Template | null;
  selectedSectionId: string | null;
  isDirty: boolean;
  setCurrentTemplate: (template: Template) => void;
  addSection: (section: TemplateSection) => void;
  updateSection: (id: string, updates: Partial<TemplateSection>) => void;
  deleteSection: (id: string) => void;
  reorderSections: (sections: TemplateSection[]) => void;
  selectSection: (id: string | null) => void;
  setDirty: (dirty: boolean) => void;
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
  isDirty: false,

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
  selectedSectionId: null,

  selectSection: (id) => set({ selectedSectionId: id }),

  setCurrentTemplate: (template) =>
    set({ currentTemplate: template, isDirty: false }),
  setDirty: (dirty) => set({ isDirty: dirty }),

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
}));
