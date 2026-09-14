import { useEffect, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { DEFAULT_CONFIG } from "../core/config";
import { readClientConsent } from "../core/cookie";
import { CONSENT_CHANGE_EVENT, openConsentBanner } from "../core/events";
import type { ConsentState } from "../core/types";

/**
 * Reads the stored decision without needing <ConsentProvider> — for footers and
 * other UI rendered outside the provider's subtree. `null` until mounted.
 */
export function useStoredConsent(
  cookieName: string = DEFAULT_CONFIG.cookieName,
  version?: number
): ConsentState | null {
  const [state, setState] = useState<ConsentState | null>(null);

  useEffect(() => {
    const check = () => {
      if (version !== undefined) {
        setState(readClientConsent(cookieName, version));
        return;
      }
      // No version given: any stored decision counts.
      const match = document.cookie.split("; ").find((c) => c.startsWith(`${cookieName}=`));
      const [decision, v] = match ? decodeURIComponent(match.slice(cookieName.length + 1)).split(".") : [];
      setState(
        decision === "accepted" || decision === "rejected"
          ? { decision, version: Number(v) }
          : { decision: null, version: 0 }
      );
    };
    check();
    window.addEventListener(CONSENT_CHANGE_EVENT, check);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, check);
  }, [cookieName, version]);

  return state;
}

export type ManageConsentButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  cookieName?: string;
  version?: number;
  /** Only render once the visitor has decided (the banner is already visible before). Default true. */
  onlyWhenDecided?: boolean;
  children?: ReactNode;
};

/** Button that reopens the banner. Works anywhere, no provider required. */
export function ManageConsentButton({
  cookieName,
  version,
  onlyWhenDecided = true,
  children,
  className,
  ...rest
}: ManageConsentButtonProps) {
  const state = useStoredConsent(cookieName, version);

  if (onlyWhenDecided && !state?.decision) return null;

  return (
    <button
      type="button"
      {...rest}
      className={`cc-manage${className ? ` ${className}` : ""}`}
      onClick={openConsentBanner}
    >
      {children ?? "Cookie settings"}
    </button>
  );
}
