/**
 * Converts a string to a URL-friendly slug
 *
 * Examples:
 * "Introduction to Python" -> "introduction-to-python"
 * "Web Security 101!!!" -> "web-security-101"
 * "C++ Programming" -> "c-programming"
 * "Cyber-Security & Ethics" -> "cyber-security-ethics"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generates a slug with a unique suffix (for uniqueness)
 * Uses first 8 chars of an ID
 *
 * Example: "introduction-to-python-9ec186d0"
 */
export function slugifyWithId(text: string, id: string): string {
  const baseSlug = slugify(text);
  const shortId = id.replace(/-/g, '').substring(0, 8);
  return `${baseSlug}-${shortId}`;
}

/**
 * Extracts the short ID from a slug-with-id format
 * "introduction-to-python-9ec186d0" -> "9ec186d0"
 */
export function extractIdFromSlug(slug: string): string | null {
  const match = slug.match(/-([a-f0-9]{8})$/i);
  return match ? match[1] : null;
}
