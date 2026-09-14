// Next.js entry. Safe in Server Components (no next/headers here — see ./server).
export { ConsentModeScript } from "./ConsentModeScript";
export { CookieConsent } from "./CookieConsent";
export type { CookieConsentProps } from "./CookieConsent";

export { fetchConsentSettings, COOKIE_CONSENT_GRAPHQL_QUERY, REST_SETTINGS_PATH } from "../core/fetch";
export { resolveConsentSettings } from "../core/settings";
export { DEFAULT_CONFIG, DEFAULT_CONTENT } from "../core/config";
export type {
  BannerPosition,
  ConsentConfig,
  ConsentContent,
  ConsentDecision,
  ConsentMode,
  ConsentState,
  ConsentTheme,
  ResolvedConsent,
  WpConsentSettings,
} from "../core/types";
