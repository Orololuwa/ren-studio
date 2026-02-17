import { describe, expect, test } from "vitest";

import type { Template, TemplateSection } from "../types";
import { mergeDataIntoTemplate } from "./merge-template-data.server";

const createMockTemplate = (sections: TemplateSection[]): Template => ({
  id: "template-1",
  name: "Test Template",
  type: "resume",
  organizationId: "org-1",
  sections,
  globalStyles: {},
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  colorPalette: [],
});

const createMockSection = (
  overrides: Partial<TemplateSection> = {},
): TemplateSection => ({
  id: "section-1",
  type: "header",
  order: 0,
  data: { name: "Default Name", title: "Default Title" },
  styles: {},
  ...overrides,
});

describe("mergeDataIntoTemplate", () => {
  test("given: a template and matching section data, should: merge provided data into the correct sections", () => {
    const section = createMockSection({ id: "header-1" });
    const template = createMockTemplate([section]);
    const newData = { "header-1": { name: "John Doe", title: "Developer" } };

    const result = mergeDataIntoTemplate(template, newData);

    expect(result).toHaveLength(1);
    expect(result[0]?.data).toEqual({ name: "John Doe", title: "Developer" });
  });

  test("given: a template and no matching section data, should: keep original data for all sections", () => {
    const section = createMockSection({
      id: "header-1",
      data: { name: "Original" },
    });
    const template = createMockTemplate([section]);

    const result = mergeDataIntoTemplate(template, {});

    expect(result).toHaveLength(1);
    expect(result[0]?.data).toEqual({ name: "Original" });
  });

  test("given: multiple sections with partial override, should: merge only matching sections and keep others unchanged", () => {
    const sections: TemplateSection[] = [
      createMockSection({
        id: "header-1",
        type: "header",
        order: 0,
        data: { name: "Original Name" },
      }),
      createMockSection({
        id: "summary-1",
        type: "summary",
        order: 1,
        data: { content: "Original Summary" },
      }),
      createMockSection({
        id: "skills-1",
        type: "skills",
        order: 2,
        data: { items: ["HTML"] },
      }),
    ];
    const template = createMockTemplate(sections);
    const newData = {
      "summary-1": { content: "Updated Summary" },
    };

    const result = mergeDataIntoTemplate(template, newData);

    expect(result).toHaveLength(3);
    expect(result[0]?.data).toEqual({ name: "Original Name" });
    expect(result[1]?.data).toEqual({ content: "Updated Summary" });
    expect(result[2]?.data).toEqual({ items: ["HTML"] });
  });

  test("given: merge data with a section ID not in the template, should: ignore the extra data", () => {
    const section = createMockSection({ id: "header-1" });
    const template = createMockTemplate([section]);
    const newData = {
      "nonexistent-section": { content: "Should be ignored" },
    };

    const result = mergeDataIntoTemplate(template, newData);

    expect(result).toHaveLength(1);
    expect(result[0]?.data).toEqual({
      name: "Default Name",
      title: "Default Title",
    });
  });

  test("given: a merged section, should: preserve section metadata (styles, order, type, id)", () => {
    const section = createMockSection({
      id: "header-1",
      type: "header",
      order: 3,
      styles: { padding: "1rem", backgroundColor: "#fff" },
      colorPalette: ["#000"],
      usingGlobalPalette: false,
    });
    const template = createMockTemplate([section]);
    const newData = { "header-1": { name: "Updated Name" } };

    const result = mergeDataIntoTemplate(template, newData);

    expect(result[0]?.id).toBe("header-1");
    expect(result[0]?.type).toBe("header");
    expect(result[0]?.order).toBe(3);
    expect(result[0]?.styles).toEqual({
      padding: "1rem",
      backgroundColor: "#fff",
    });
    expect(result[0]?.colorPalette).toEqual(["#000"]);
    expect(result[0]?.usingGlobalPalette).toBe(false);
    expect(result[0]?.data).toEqual({ name: "Updated Name" });
  });

  test("given: an empty sections template, should: return an empty array", () => {
    const template = createMockTemplate([]);

    const result = mergeDataIntoTemplate(template, {
      "some-id": { data: "value" },
    });

    expect(result).toEqual([]);
  });
});
