import type { ComponentType } from "react";
// Imported through the package name (kept external at build time) so the
// "use client" boundary of the React entry survives bundling.
import { ConsentProvider, CookieBanner } from "@twenty-twenty/cookie-consent/react";
import type { PolicyLinkProps } from "@twenty-twenty/cookie-consent/react";
import { fetchConsentSettings } from "../core/fetch";
import type { ConsentFetchInit } from "../core/fetch";
import { resolveConsentSettings } from "../core/settings";
import type { ResolveOverrides } from "../core/settings";
import type { WpConsentSettings } from "../core/types";
import { ConsentModeScript } from "./ConsentModeScript";

export type CookieConsentProps = {
  /** WordPress URL. Settings are fetched from the plugin's REST route (or GraphQL). */
  wordpressUrl?: string;
  transport?: "rest" | "graphql";
  /** Full endpoint override, e.g. a proxied GraphQL URL. */
  endpoint?: string;
  /** Already-fetched settings — skips the request (use with your own GraphQL client). */
  settings?: WpConsentSettings | null;
  /** Project-level fallbacks for empty CMS fields. */
  fallbacks?: ResolveOverrides;
  /** Next.js fetch cache. Default `{ revalidate: 3600, tags: ["cookie-consent"] }`. */
  fetchInit?: ConsentFetchInit;
  LinkComponent?: ComponentType<PolicyLinkProps>;
  className?: string;
  /** Skip Google Consent Mode (default script + updates). */
  disableGoogleConsent?: boolean;
  /** Activate `<script type="text/plain" data-cookie-consent>` tags when allowed. */
  unlockScripts?: boolean;
  nonce?: string;
};

/**
 * Drop-in Server Component: fetches settings from WordPress, renders the
 * Consent Mode default script and the banner. Place in the root layout,
 * before your GA/GTM tag.
 */
export async function CookieConsent({
  wordpressUrl,
  transport,
  endpoint,
  settings,
  fallbacks,
  fetchInit = { next: { revalidate: 3600, tags: ["cookie-consent"] } },
  LinkComponent,
  className,
  disableGoogleConsent,
  unlockScripts,
  nonce,
}: CookieConsentProps) {
  let raw = settings;
  if (raw === undefined && (wordpressUrl || endpoint)) {
    raw = await fetchConsentSettings({
      wordpressUrl: wordpressUrl ?? "",
      transport,
      endpoint,
      init: fetchInit,
    });
  }

  const { config, content, position } = resolveConsentSettings(raw, fallbacks);

  return (
    <>
      {!disableGoogleConsent && <ConsentModeScript config={config} nonce={nonce} />}
      <ConsentProvider config={config} disableGoogleConsent={disableGoogleConsent} unlockScripts={unlockScripts}>
        <CookieBanner content={content} position={position} className={className} LinkComponent={LinkComponent} />
      </ConsentProvider>
    </>
  );
}
