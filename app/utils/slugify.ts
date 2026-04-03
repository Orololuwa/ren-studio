export function slugify(string = ""): string {
  return string
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036F]/g, "")
    .replaceAll(/\s+/g, "-")
    .replaceAll(/[^\w.-]+/g, "")
    .toLowerCase()
    .replaceAll(/^-+|-+$/g, "");
}
