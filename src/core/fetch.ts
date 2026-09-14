import type { WpConsentSettings } from "./types";

// Fetch the banner settings from a WordPress install running the plugin.
// Works server-side (Next.js RSC, Astro, Nuxt, …) or in the browser.

export const REST_SETTINGS_PATH = "/wp-json/20twenty-cookie-consent/v1/settings";

export const COOKIE_CONSENT_GRAPHQL_QUERY = /* GraphQL */ `
  query CookieConsentSettings {
    cookieConsentSettings {
      bannerTitle
      bannerText
      acceptLabel
      rejectLabel
      policyUrl
      policyLabel
      manageLabel
      mode
      version
      cookieName
      expiryDays
      cookieDomain
      position
    }
  }
`;

/** RequestInit plus Next.js' `next` cache options (ignored elsewhere). */
export type ConsentFetchInit = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] };
};

export type FetchConsentSettingsOptions = {
  /** WordPress site URL, e.g. "https://cms.example.com". */
  wordpressUrl: string;
  /** "rest" (default, no extra plugin needed) or "graphql" (needs WPGraphQL). */
  transport?: "rest" | "graphql";
  /** Override the full endpoint URL (e.g. "?rest_route=…" or a proxied /graphql). */
  endpoint?: string;
  /** Extra fetch options: headers, Next.js `next: { revalidate, tags }`, … */
  init?: ConsentFetchInit;
  /** Throw on network/HTTP errors instead of resolving to null. Default false. */
  throwOnError?: boolean;
  /** Custom fetch implementation. Defaults to global fetch. */
  fetch?: typeof fetch;
};

const trimSlash = (url: string) => url.replace(/\/+$/, "");

export async function fetchConsentSettings(
  options: FetchConsentSettingsOptions
): Promise<WpConsentSettings | null> {
  const transport = options.transport ?? "rest";
  const doFetch = options.fetch ?? fetch;
  const base = trimSlash(options.wordpressUrl);
  const init = options.init ?? {};

  try {
    if (transport === "graphql") {
      const res = await doFetch(options.endpoint ?? `${base}/graphql`, {
        ...init,
        method: "POST",
        headers: { "Content-Type": "application/json", ...(init.headers as Record<string, string>) },
        body: JSON.stringify({ query: COOKIE_CONSENT_GRAPHQL_QUERY }),
      } as RequestInit);
      if (!res.ok) throw new Error(`Cookie consent GraphQL request failed: HTTP ${res.status}`);
      const json = (await res.json()) as {
        data?: { cookieConsentSettings?: WpConsentSettings | null };
        errors?: { message: string }[];
      };
      if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
      return json.data?.cookieConsentSettings ?? null;
    }

    const res = await doFetch(options.endpoint ?? `${base}${REST_SETTINGS_PATH}`, {
      ...init,
      method: "GET",
      headers: { Accept: "application/json", ...(init.headers as Record<string, string>) },
    } as RequestInit);
    if (!res.ok) throw new Error(`Cookie consent REST request failed: HTTP ${res.status}`);
    return (await res.json()) as WpConsentSettings;
  } catch (error) {
    if (options.throwOnError) throw error;
    return null;
  }
}
