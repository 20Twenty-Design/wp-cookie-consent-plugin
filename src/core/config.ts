import type { BannerPosition, ConsentConfig, ConsentContent } from "./types";

// Defaults so everything renders and behaves correctly before a host project
// (or the WordPress plugin) supplies its own values. Keep in sync with
// Settings::defaults() in the PHP plugin.

export const DEFAULT_CONFIG: ConsentConfig = {
  cookieName: "cookie_consent",
  mode: "opt-in",
  version: 1,
  expiryDays: 365,
};

export const DEFAULT_CONTENT: ConsentContent = {
  body: "We use cookies to analyze traffic and improve your experience.",
  acceptLabel: "Accept",
  rejectLabel: "Decline",
  policyLabel: "Privacy Policy",
  manageLabel: "Cookie settings",
};

export const DEFAULT_POSITION: BannerPosition = "bar";
