const RESERVED = new Set(["admin", "api", "dashboard", "login", "signup", "onboarding", "b", "app", "www", "help", "support"]);

export function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugError(slug: string): string | null {
  if (slug.length < 3 || slug.length > 40) return "כתובת הדף צריכה להיות באורך 3–40 תווים";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return "רק אותיות באנגלית, מספרים ומקפים";
  if (RESERVED.has(slug)) return "הכתובת הזו שמורה, נסי אחרת";
  return null;
}
