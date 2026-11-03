// Removes analytics / advertising cookies after a visitor declines. Tags that
// respect consent stop writing new cookies, but whatever they set earlier
// (e.g. during an opt-out visit before "Decline") would otherwise linger for
// months. HttpOnly cookies (e.g. server-side GTM's FPID) can't be reached from
// JS and must be handled on the server.

/** Cookie names (exact) and prefixes (ending in `*`) removed by default. */
export const DEFAULT_TRACKING_COOKIES: readonly string[] = [
  "_ga",
  "_ga_*", // GA4 property cookies
  "_gid",
  "_gat*",
  "_gcl_*", // Google Ads conversion linker
  "_fbp", // Meta Pixel
  "_fbc",
  "_hj*", // Hotjar
];

function matches(name: string, patterns: readonly string[]): boolean {
  return patterns.some((p) => (p.endsWith("*") ? name.startsWith(p.slice(0, -1)) : name === p));
}

/** The host plus each parent domain, e.g. www.a.co.uk -> [www.a.co.uk, a.co.uk, co.uk].
 *  Browsers ignore deletes on public suffixes, so trying them is harmless. */
function candidateDomains(host: string): string[] {
  const parts = host.split(".");
  const out: string[] = [];
  for (let i = 0; i < parts.length - 1; i++) out.push(parts.slice(i).join("."));
  return out;
}

/**
 * Expire every readable cookie matching the patterns, on the host and on each
 * parent domain (tags usually set them on `.example.com`). Returns the names removed.
 */
export function clearTrackingCookies(patterns: readonly string[] = DEFAULT_TRACKING_COOKIES): string[] {
  if (typeof document === "undefined" || !document.cookie) return [];
  const names = new Set(
    document.cookie
      .split("; ")
      .map((c) => c.split("=")[0] ?? "")
      .filter((n) => n !== "" && matches(n, patterns))
  );
  const host = typeof location !== "undefined" ? location.hostname : "";
  const domains = host && host.includes(".") ? candidateDomains(host) : [];
  const expire = "=; Path=/; Max-Age=0; SameSite=Lax";
  for (const name of names) {
    document.cookie = `${name}${expire}`;
    for (const d of domains) document.cookie = `${name}${expire}; Domain=.${d}`;
  }
  return [...names];
}
