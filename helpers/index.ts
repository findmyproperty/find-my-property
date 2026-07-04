export const normalizePhone = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.startsWith("+")) return trimmed;
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    return trimmed;
  };

/** Simple slugify for category names (lowercase kebab). */
export const slugify = (input: string): string => {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};