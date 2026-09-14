import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { commitDecision, isConsentGranted } from "../core/consent";
import { readClientConsent } from "../core/cookie";
import { CONSENT_OPEN_EVENT } from "../core/events";
import { unlockConsentScripts } from "../core/scripts";
import type { ConsentConfig, ConsentDecision, ConsentState } from "../core/types";

export type ConsentContextValue = {
  config: ConsentConfig;
  state: ConsentState;
  decided: boolean;
  /** Tracking allowed (accepted, or undecided in opt-out mode). */
  granted: boolean;
  bannerOpen: boolean;
  accept: () => void;
  reject: () => void;
  reopen: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within <ConsentProvider>");
  return ctx;
}

export type ConsentProviderProps = {
  config: ConsentConfig;
  /** Optional decision read on the server. Omit to decide entirely on the
   *  client (keeps the host app statically renderable). */
  initialState?: ConsentState;
  /** Runs on every decision — hook non-Google tools in here. */
  onChange?: (state: ConsentState) => void;
  /** Skip the built-in Google Consent Mode update. */
  disableGoogleConsent?: boolean;
  /** Activate `<script type="text/plain" data-cookie-consent>` tags when allowed. Default false. */
  unlockScripts?: boolean;
  children: ReactNode;
};

export function ConsentProvider({
  config,
  initialState,
  onChange,
  disableGoogleConsent,
  unlockScripts,
  children,
}: ConsentProviderProps) {
  const [state, setState] = useState<ConsentState>(initialState ?? { decision: null, version: config.version });
  // Never render the banner during SSR — the real decision is read from the
  // cookie on mount, so decided visitors never see a flash.
  const [bannerOpen, setBannerOpen] = useState(false);

  // Re-sync from the live cookie on mount (covers a version bump or a decision
  // made in another tab) and listen for "reopen" requests from elsewhere.
  useEffect(() => {
    const fresh = readClientConsent(config.cookieName, config.version);
    setState(fresh);
    setBannerOpen(fresh.decision === null);

    const onOpen = () => setBannerOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, [config.cookieName, config.version]);

  const granted = isConsentGranted(state, config.mode);

  useEffect(() => {
    if (unlockScripts && granted) unlockConsentScripts();
  }, [unlockScripts, granted]);

  const decide = useCallback(
    (decision: ConsentDecision) => {
      const next = commitDecision(config, decision, { googleConsent: !disableGoogleConsent });
      setState(next);
      setBannerOpen(false);
      onChange?.(next);
    },
    [config, disableGoogleConsent, onChange]
  );

  const value = useMemo<ConsentContextValue>(
    () => ({
      config,
      state,
      decided: state.decision !== null,
      granted,
      bannerOpen,
      accept: () => decide("accepted"),
      reject: () => decide("rejected"),
      reopen: () => setBannerOpen(true),
    }),
    [config, state, granted, bannerOpen, decide]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}
