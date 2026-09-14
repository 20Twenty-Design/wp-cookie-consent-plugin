import Script from "next/script";
import { consentDefaultInlineScript } from "../core/google";
import type { ConsentConfig } from "../core/types";

// Emits the Google Consent Mode v2 *default* before any tag loads.
// `beforeInteractive` guarantees it runs ahead of afterInteractive GA/GTM and
// Next injects it into <head>. It reads the stored decision client-side, so no
// server cookie read is needed — the host app stays statically renderable.
export function ConsentModeScript({
  config,
  waitForUpdate = 500,
  nonce,
}: {
  config: Pick<ConsentConfig, "cookieName" | "version" | "mode">;
  waitForUpdate?: number;
  nonce?: string;
}) {
  return (
    // beforeInteractive is the correct strategy for a consent manager in the
    // App Router (rendered from app/layout).
    <Script
      id="consent-mode-default"
      strategy="beforeInteractive"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: consentDefaultInlineScript(config, waitForUpdate) }}
    />
  );
}
