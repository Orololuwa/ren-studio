import { describe, expect, test } from "vitest";

import { sanitizeQuillHtml } from "./sanitize-quill-html.server";

describe("sanitizeQuillHtml", () => {
  test("given: an empty string, should: return the empty string unchanged", () => {
    expect(sanitizeQuillHtml("")).toBe("");
  });

  test("given: a falsy value, should: return it unchanged", () => {
    // The function checks `if (!html) return html`
    expect(sanitizeQuillHtml("")).toBe("");
  });

  test("given: HTML with no &nbsp;, should: return the string unchanged", () => {
    const html = "<p>Hello world</p>";
    expect(sanitizeQuillHtml(html)).toBe(html);
  });

  test("given: &nbsp; before a hyphen, should: replace it with a regular space", () => {
    const input = "self&nbsp;-taught developer";
    const expected = "self -taught developer";
    expect(sanitizeQuillHtml(input)).toBe(expected);
  });

  test("given: &nbsp; after a hyphen, should: replace it with a regular space", () => {
    const input = "full-&nbsp;stack";
    const expected = "full- stack";
    expect(sanitizeQuillHtml(input)).toBe(expected);
  });

  test("given: &nbsp; between alphanumeric characters, should: replace it with a regular space", () => {
    const input = "hello&nbsp;world";
    const expected = "hello world";
    expect(sanitizeQuillHtml(input)).toBe(expected);
  });

  test("given: multiple consecutive &nbsp;, should: collapse them into a single space", () => {
    const input = "hello&nbsp;&nbsp;&nbsp;world";
    const expected = "hello world";
    expect(sanitizeQuillHtml(input)).toBe(expected);
  });

  test("given: standalone &nbsp; not at HTML tag boundaries, should: replace with a regular space", () => {
    const input = "some&nbsp;text";
    const expected = "some text";
    expect(sanitizeQuillHtml(input)).toBe(expected);
  });

  test("given: &nbsp; at HTML tag boundaries, should: preserve it", () => {
    // &nbsp; right after > or right before < should not be replaced by the last rule
    const input = "<p>&nbsp;</p>";
    // The > before &nbsp; and < after mean the last regex doesn't match
    expect(sanitizeQuillHtml(input)).toBe("<p>&nbsp;</p>");
  });

  test("given: HTML with rich content and &nbsp; around hyphens, should: sanitize correctly", () => {
    const input =
      "<p>I am a self&nbsp;-&nbsp;taught full&nbsp;-&nbsp;stack developer</p>";
    const result = sanitizeQuillHtml(input);
    expect(result).not.toContain("&nbsp;-");
    expect(result).not.toContain("-&nbsp;");
  });

  test("given: &nbsp; between a number and alphanumeric character, should: replace it", () => {
    const input = "version2&nbsp;beta";
    const expected = "version2 beta";
    expect(sanitizeQuillHtml(input)).toBe(expected);
  });

  test("given: a complex HTML structure, should: preserve tag structure while sanitizing &nbsp;", () => {
    const input =
      "<ul><li>React&nbsp;-&nbsp;Frontend</li><li>Node&nbsp;-&nbsp;Backend</li></ul>";
    const result = sanitizeQuillHtml(input);
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>");
    expect(result).toContain("</li>");
    expect(result).toContain("</ul>");
    // Hyphens should no longer have &nbsp; adjacent
    expect(result).not.toContain("&nbsp;-");
    expect(result).not.toContain("-&nbsp;");
  });
});
