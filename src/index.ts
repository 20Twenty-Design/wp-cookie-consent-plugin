// Core entry: framework-agnostic, safe on server and client.
export { DEFAULT_CONFIG, DEFAULT_CONTENT, DEFAULT_POSITION } from "./core/config";
export {
  serializeConsent,
  parseConsent,
  readCookie,
  readClientConsent,
  writeClientConsent,
  clearClientConsent,
} from "./core/cookie";
export {
  CONSENT_OPEN_EVENT,
  CONSENT_CHANGE_EVENT,
  openConsentBanner,
  onConsentChange,
  dispatchConsentChange,
} from "./core/events";
export { updateGoogleConsent, applyConsentDefault, consentDefaultInlineScript } from "./core/google";
export { isConsentGranted, commitDecision } from "./core/consent";
export type { CommitOptions } from "./core/consent";
export { resolveConsentSettings } from "./core/settings";
export type { ResolveOverrides } from "./core/settings";
export { fetchConsentSettings, COOKIE_CONSENT_GRAPHQL_QUERY, REST_SETTINGS_PATH } from "./core/fetch";
export type { FetchConsentSettingsOptions, ConsentFetchInit } from "./core/fetch";
export { isExternalUrl } from "./core/url";
export { unlockConsentScripts } from "./core/scripts";
export type {
  BannerPosition,
  ConsentConfig,
  ConsentContent,
  ConsentDecision,
  ConsentMode,
  ConsentState,
  ResolvedConsent,
  WpConsentSettings,
} from "./core/types";
