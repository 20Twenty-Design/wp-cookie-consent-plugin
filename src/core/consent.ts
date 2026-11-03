import { writeClientConsent } from "./cookie";
import { dispatchConsentChange } from "./events";
import { updateGoogleConsent } from "./google";
import { clearTrackingCookies } from "./tracking-cookies";
import type { ConsentConfig, ConsentDecision, ConsentMode, ConsentState } from "./types";

/** Is tracking allowed for this state? Undecided visitors follow the mode. */
export function isConsentGranted(state: ConsentState, mode: ConsentMode): boolean {
  if (state.decision === "accepted") return true;
  if (state.decision === "rejected") return false;
  return mode === "opt-out";
}

export type CommitOptions = {
  /** Push a Google Consent Mode update. Default true. */
  googleConsent?: boolean;
};

/**
 * Persist a decision and broadcast it: writes the cookie, updates Google
 * Consent Mode, removes tracking cookies on "rejected" and fires
 * CONSENT_CHANGE_EVENT. Shared by every renderer.
 */
export function commitDecision(
  config: ConsentConfig,
  decision: ConsentDecision,
  options: CommitOptions = {}
): ConsentState {
  writeClientConsent(config, decision);
  const state: ConsentState = { decision, version: config.version };
  if (options.googleConsent !== false) updateGoogleConsent(decision === "accepted");
  if (decision === "rejected") clearTrackingCookies();
  dispatchConsentChange(state);
  return state;
}
