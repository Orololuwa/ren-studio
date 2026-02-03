/**
 * Sanitizes React Quill HTML output by replacing &nbsp; with regular spaces
 * in contexts where they interfere with normal word wrapping (e.g., around hyphens).
 * This prevents hyphenated words from breaking unexpectedly.
 *
 * This function should be called when rendering rich text content for preview/export,
 * not during editing in the editor.
 */
export function sanitizeQuillHtml(html: string): string {
  if (!html) return html;

  // Replace &nbsp; that are adjacent to hyphens or between alphanumeric characters
  // This prevents hyphenated words from breaking unexpectedly
  return (
    html
      // Replace &nbsp; before or after hyphens with regular spaces
      .replace(/&nbsp;(-)/g, " $1")
      .replace(/(-)&nbsp;/g, "$1 ")
      // Replace &nbsp; between alphanumeric characters (normal word boundaries) with regular spaces
      .replace(/([a-zA-Z0-9])&nbsp;([a-zA-Z0-9-])/g, "$1 $2")
      // Replace multiple consecutive &nbsp; with single space
      .replace(/(&nbsp;){2,}/g, " ")
      // Replace standalone &nbsp; (not at HTML tag boundaries) with regular space
      .replace(/([^>])&nbsp;([^<])/g, "$1 $2")
  );
}
