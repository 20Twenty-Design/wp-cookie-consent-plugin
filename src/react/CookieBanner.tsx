import { useEffect, useRef } from "react";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import { CONSENT_OPEN_EVENT } from "../core/events";
import { themeToCssVars } from "../core/theme";
import { isExternalUrl } from "../core/url";
import type { BannerPosition, ConsentContent, ConsentTheme } from "../core/types";
import { useConsent } from "./ConsentProvider";
import { setManageLabel } from "./manageLabel";

/** Props an injected link renderer receives. Lets a host use its own router
 *  link (e.g. next/link) instead of a plain anchor. */
export type PolicyLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

export type CookieBannerProps = {
  content: ConsentContent;
  position?: BannerPosition;
  /** Colours from the CMS. Applied as --cc-* variables on the banner; unset keeps your CSS. */
  theme?: ConsentTheme;
  /** Extra class on the banner root for project-specific overrides. */
  className?: string;
  /** Optional link component for the policy link. Falls back to <a>. */
  LinkComponent?: ComponentType<PolicyLinkProps>;
};

// Markup mirrors vanilla/buildBanner so `styles.css` fits both.
export function CookieBanner({ content, position = "bar", theme, className, LinkComponent }: CookieBannerProps) {
  const { bannerOpen, accept, reject } = useConsent();
  const firstButton = useRef<HTMLButtonElement>(null);

  // Share the CMS "Manage cookies" label with ManageConsentButton (often in a footer).
  useEffect(() => {
    setManageLabel(content.manageLabel);
  }, [content.manageLabel]);

  // Move focus into the banner when it is reopened on purpose (not on page load).
  useEffect(() => {
    const onOpen = () => requestAnimationFrame(() => firstButton.current?.focus());
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, []);

  if (!bannerOpen) return null;

  const policyLabel = content.policyLabel || "Learn more";

  return (
    <div
      className={`cc-banner cc-banner--${position}${className ? ` ${className}` : ""}`}
      role="dialog"
      aria-live="polite"
      aria-label={content.title || "Cookie consent"}
      style={themeToCssVars(theme) as CSSProperties}
    >
      <div className="cc-text">
        {content.title && <p className="cc-title">{content.title}</p>}
        <p className="cc-body">
          {content.body}
          {content.policyUrl && (
            <>
              {" "}
              {LinkComponent ? (
                <LinkComponent className="cc-policy" href={content.policyUrl}>
                  {policyLabel}
                </LinkComponent>
              ) : isExternalUrl(content.policyUrl) ? (
                <a className="cc-policy" href={content.policyUrl} target="_blank" rel="noopener noreferrer">
                  {policyLabel}
                </a>
              ) : (
                <a className="cc-policy" href={content.policyUrl}>
                  {policyLabel}
                </a>
              )}
            </>
          )}
        </p>
      </div>

      <div className="cc-actions">
        <button ref={firstButton} type="button" className="cc-btn cc-btn--reject" onClick={reject}>
          {content.rejectLabel}
        </button>
        <button type="button" className="cc-btn cc-btn--accept" onClick={accept}>
          {content.acceptLabel}
        </button>
      </div>
    </div>
  );
}
