// Framework-agnostic types. Nothing in core/ imports React, Next or the DOM
// beyond guarded `document` / `window` access.

export type ConsentDecision = "accepted" | "rejected";

/** opt-in  = EU/UK: tracking off until accepted.
 *  opt-out = US: tracking on by default, visitor can decline. */
export type ConsentMode = "opt-in" | "opt-out";

/** Where the banner sits. `bar` = full-width bottom bar, `box-*` = corner card. */
export type BannerPosition = "bar" | "box-left" | "box-right";

export type ConsentState = {
  /** null = the visitor has not chosen yet (show the banner). */
  decision: ConsentDecision | null;
  version: number;
};

export type ConsentConfig = {
  /** Cookie name that stores the decision. */
  cookieName: string;
  mode: ConsentMode;
  /** Bump to invalidate stored decisions and re-prompt everyone. */
  version: number;
  /** Cookie lifetime in days. */
  expiryDays: number;
  /** Optional cookie Domain, e.g. ".example.com" to share across subdomains. */
  cookieDomain?: string;
};

export type ConsentContent = {
  title?: string;
  body: string;
  acceptLabel: string;
  rejectLabel: string;
  policyUrl?: string;
  policyLabel?: string;
  /** Label for the "reopen / opt out" link placed elsewhere (e.g. footer). */
  manageLabel?: string;
};

/**
 * Raw settings as returned by the WordPress plugin (REST or WPGraphQL).
 * Every field is optional/nullable — CMS data is never trusted to be complete.
 */
export type WpConsentSettings = {
  bannerTitle?: string | null;
  bannerText?: string | null;
  acceptLabel?: string | null;
  rejectLabel?: string | null;
  policyUrl?: string | null;
  policyLabel?: string | null;
  manageLabel?: string | null;
  mode?: string | null;
  version?: number | null;
  cookieName?: string | null;
  expiryDays?: number | null;
  cookieDomain?: string | null;
  position?: string | null;
};

/** Normalised result of `resolveConsentSettings`. */
export type ResolvedConsent = {
  config: ConsentConfig;
  content: ConsentContent;
  position: BannerPosition;
};
