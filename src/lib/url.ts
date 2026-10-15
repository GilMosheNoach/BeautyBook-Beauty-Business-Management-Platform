export function appUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return base + path;
}

/** e.g. "beautybook.co.il" when every business gets <slug>.beautybook.co.il; empty when not configured. */
export function rootDomain() {
  return (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "").trim().toLowerCase().replace(/^\.+|\.+$/g, "");
}

/**
 * The public address of a business page: https://<slug>.<root domain> once a root
 * domain is configured, otherwise <app url>/b/<slug>. `path` is relative to the page ("/a/<token>").
 */
export function businessUrl(slug: string, path = "") {
  const root = rootDomain();
  if (!root) return appUrl(`/b/${slug}${path}`);
  const protocol = appUrl().startsWith("http://") ? "http" : "https";
  return `${protocol}://${slug}.${root}${path}`;
}

// Labels under the root domain that are never businesses.
const NON_BUSINESS_LABELS = new Set(["www", "app"]);

/**
 * Reads the business slug from a Host header such as "michal.beautybook.co.il".
 * Without a configured root domain, "<slug>.localhost" still works for local testing.
 */
export function slugFromHost(host: string | null, root = rootDomain()): string | null {
  if (!host) return null;
  const hostname = host.toLowerCase().replace(/:\d+$/, "");
  const base = (root || "localhost").replace(/:\d+$/, "");
  if (!hostname.endsWith(`.${base}`)) return null;
  const label = hostname.slice(0, -(base.length + 1));
  if (!label || label.includes(".") || NON_BUSINESS_LABELS.has(label)) return null;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(label) ? label : null;
}

/** The fixed text around the slug input in forms: "app.co.il/b/" before it, or ".beautybook.co.il" after it. */
export function slugAffixes() {
  const root = rootDomain();
  return root ? { prefix: "", suffix: `.${root}` } : { prefix: `${appUrl().replace(/^https?:\/\//, "")}/b/`, suffix: "" };
}
