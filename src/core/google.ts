import type { ConsentConfig } from "./types";

// Google Consent Mode v2.
//
// gtag.js only processes `arguments` objects pushed onto dataLayer — a plain
// array like `dataLayer.push(["consent", "update", {...}])` is silently
// ignored — so both helpers go through a real `gtag()` shim.

type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

export function updateGoogleConsent(granted: boolean): void {
  if (typeof window === "undefined") return;
  const w = window as GtagWindow;
  const value = granted ? "granted" : "denied";
  const params = {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  };
  if (typeof w.gtag === "function") {
    w.gtag("consent", "update", params);
    return;
  }
  w.dataLayer = w.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  const gtag = function (..._args: unknown[]) {
    (w.dataLayer as unknown[]).push(arguments);
  };
  gtag("consent", "update", params);
}

/**
 * Emits the Consent Mode *default* from the stored cookie. Must run before any
 * Google tag loads, so it is inlined into <head>.
 *
 * IMPORTANT: this function is serialised with `.toString()` for the inline
 * script, so it must stay self-contained — no imports, no closures, ES5 only.
 *
 * Default resolution:
 *   explicit "accepted" -> granted
 *   explicit "rejected" -> denied
 *   no decision yet     -> opt-out: granted, opt-in: denied
 */
export function applyConsentDefault(name: string, version: number, mode: string, waitForUpdate: number): void {
  var decision = null;
  var parts = document.cookie.split("; ");
  for (var i = 0; i < parts.length; i++) {
    if (parts[i]!.indexOf(name + "=") === 0) {
      var p = decodeURIComponent(parts[i]!.slice(name.length + 1)).split(".");
      if (Number(p[1]) === version && (p[0] === "accepted" || p[0] === "rejected")) decision = p[0];
    }
  }
  var granted = decision === "accepted" ? true : decision === "rejected" ? false : mode === "opt-out";
  var v = granted ? "granted" : "denied";
  var w = window as any;
  w.dataLayer = w.dataLayer || [];
  var gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  } as (...args: unknown[]) => void;
  gtag("consent", "default", {
    ad_storage: v,
    ad_user_data: v,
    ad_personalization: v,
    analytics_storage: v,
    wait_for_update: waitForUpdate,
  });
}

/** Inline JS string for the Consent Mode default (for a <script> in <head>). */
export function consentDefaultInlineScript(
  config: Pick<ConsentConfig, "cookieName" | "version" | "mode">,
  waitForUpdate = 500
): string {
  return `(${applyConsentDefault.toString()})(${JSON.stringify(config.cookieName)},${Number(
    config.version
  )},${JSON.stringify(config.mode)},${Number(waitForUpdate)});`;
}
