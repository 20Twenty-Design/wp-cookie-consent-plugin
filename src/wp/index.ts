// WordPress front-end bundle. Reads the boot data printed by the plugin and
// mounts the vanilla banner.
import { isConsentGranted } from "../core/consent";
import { createCookieConsent } from "../vanilla";
import type { ConsentMode, ConsentState } from "../core/types";
import "./types";

// WP Consent API (https://wordpress.org/plugins/wp-consent-api/) — lets
// Site Kit, WooCommerce and other consent-aware plugins follow the decision.
function syncWpConsentApi(state: ConsentState, mode: ConsentMode) {
  if (typeof window.wp_set_consent !== "function") return;
  const value = isConsentGranted(state, mode) ? "allow" : "deny";
  window.wp_set_consent("functional", "allow");
  ["preferences", "statistics", "statistics-anonymous", "marketing"].forEach((category) =>
    window.wp_set_consent!(category, value)
  );
}

function boot() {
  const data = window.TwentyCookieConsent;
  if (!data || window.twentyCookieConsent) return;

  const instance = createCookieConsent({
    config: data.config,
    content: data.content,
    position: data.position,
    googleConsent: data.googleConsent,
    openSelector: data.openSelector,
    onChange: (state) => {
      if (data.wpConsentApi) syncWpConsentApi(state, data.config.mode);
    },
  });

  window.twentyCookieConsent = instance;
  if (data.wpConsentApi && instance.getState().decision !== null) {
    syncWpConsentApi(instance.getState(), data.config.mode);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
