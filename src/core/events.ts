import type { ConsentState } from "./types";

// Decoupled window events so UI outside the banner (a footer "Manage cookies"
// link, a React tree, a WordPress menu item) can react without shared state.

/** Ask whichever banner is mounted to (re)open. */
export const CONSENT_OPEN_EVENT = "cookie-consent:open";

/** Fired whenever a decision is made. `event.detail` is the new ConsentState. */
export const CONSENT_CHANGE_EVENT = "cookie-consent:change";

export function openConsentBanner(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

export function dispatchConsentChange(state: ConsentState): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_CHANGE_EVENT, { detail: state }));
}

/** Subscribe to decisions. Returns an unsubscribe function. */
export function onConsentChange(listener: (state: ConsentState) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => listener((e as CustomEvent<ConsentState>).detail);
  window.addEventListener(CONSENT_CHANGE_EVENT, handler);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, handler);
}
