import type { BannerPosition, ConsentConfig, ConsentContent } from "../core/types";
import type { CookieConsentInstance } from "../vanilla";

/** Boot data printed by the PHP plugin as `window.TwentyCookieConsent`. */
export type WpBootData = {
  config: ConsentConfig;
  content: ConsentContent;
  position: BannerPosition;
  googleConsent: boolean;
  /** WP Consent API plugin detected. */
  wpConsentApi: boolean;
  openSelector?: string;
};

declare global {
  interface Window {
    TwentyCookieConsent?: WpBootData;
    /** Live banner instance: open(), accept(), reject(), getState(), … */
    twentyCookieConsent?: CookieConsentInstance;
    wp_consent_type?: string;
    wp_set_consent?: (category: string, value: "allow" | "deny") => void;
  }
}
