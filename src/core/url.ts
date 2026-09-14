/** True for absolute http(s) URLs pointing at another origin. Relative URLs are internal. */
export function isExternalUrl(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false;
  if (typeof location === "undefined") return true;
  try {
    return new URL(href).origin !== location.origin;
  } catch {
    return false;
  }
}
