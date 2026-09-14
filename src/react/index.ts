// React entry (Client Components). Built with a "use client" banner.
export { ConsentProvider, useConsent } from "./ConsentProvider";
export type { ConsentProviderProps, ConsentContextValue } from "./ConsentProvider";
export { CookieBanner } from "./CookieBanner";
export type { CookieBannerProps, PolicyLinkProps } from "./CookieBanner";
export { ManageConsentButton, useStoredConsent } from "./ManageConsentButton";
export type { ManageConsentButtonProps } from "./ManageConsentButton";

export {
  openConsentBanner,
  onConsentChange,
  CONSENT_OPEN_EVENT,
  CONSENT_CHANGE_EVENT,
} from "../core/events";
export { updateGoogleConsent } from "../core/google";
export { DEFAULT_CONFIG, DEFAULT_CONTENT } from "../core/config";
export type {
  BannerPosition,
  ConsentConfig,
  ConsentContent,
  ConsentDecision,
  ConsentMode,
  ConsentState,
} from "../core/types";
