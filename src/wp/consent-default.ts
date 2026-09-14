// Inlined into <head> by the PHP plugin, right after the boot data and before
// any other script, so Google tags see the Consent Mode default first.
import { applyConsentDefault } from "../core/google";
import "./types";

const data = window.TwentyCookieConsent;

if (data) {
  if (data.wpConsentApi) {
    window.wp_consent_type = data.config.mode === "opt-in" ? "optin" : "optout";
  }
  if (data.googleConsent) {
    applyConsentDefault(data.config.cookieName, data.config.version, data.config.mode, 500);
  }
}
