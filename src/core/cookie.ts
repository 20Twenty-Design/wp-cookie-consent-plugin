import type { ConsentConfig, ConsentDecision, ConsentState } from "./types";

// Cookie value format: `<decision>.<version>` e.g. "accepted.1".
// A version mismatch is treated as "no decision yet" so bumping the config
// version re-prompts every visitor.

export function serializeConsent(decision: ConsentDecision, version: number): string {
  return `${decision}.${version}`;
}

export function parseConsent(raw: string | null | undefined, currentVersion: number): ConsentState {
  if (!raw) return { decision: null, version: currentVersion };
  const [decision, v] = decodeURIComponent(raw).split(".");
  const version = Number(v);
  if ((decision !== "accepted" && decision !== "rejected") || version !== currentVersion) {
    return { decision: null, version: currentVersion };
  }
  return { decision, version };
}

/* --- client-only helpers (guard against SSR) --- */

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const match = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

export function readClientConsent(name: string, version: number): ConsentState {
  return parseConsent(readCookie(name), version);
}

export function writeClientConsent(
  config: Pick<ConsentConfig, "cookieName" | "version" | "expiryDays" | "cookieDomain">,
  decision: ConsentDecision
): void {
  if (typeof document === "undefined") return;
  const maxAge = Math.round(config.expiryDays * 24 * 60 * 60);
  const secure = location.protocol === "https:" ? "; Secure" : "";
  const domain = config.cookieDomain ? `; Domain=${config.cookieDomain}` : "";
  document.cookie =
    `${config.cookieName}=${serializeConsent(decision, config.version)}` +
    `; Path=/; Max-Age=${maxAge}; SameSite=Lax${domain}${secure}`;
}

export function clearClientConsent(config: Pick<ConsentConfig, "cookieName" | "cookieDomain">): void {
  if (typeof document === "undefined") return;
  const domain = config.cookieDomain ? `; Domain=${config.cookieDomain}` : "";
  document.cookie = `${config.cookieName}=; Path=/; Max-Age=0; SameSite=Lax${domain}`;
}
