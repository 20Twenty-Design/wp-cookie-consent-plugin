// Framework-free banner. Used by the WordPress plugin bundle and by headless
// sites that don't use React (Astro, Nuxt, SvelteKit, plain HTML, …).
import { DEFAULT_CONFIG, DEFAULT_CONTENT, DEFAULT_POSITION } from "../core/config";
import { commitDecision, isConsentGranted } from "../core/consent";
import { readClientConsent } from "../core/cookie";
import { CONSENT_OPEN_EVENT } from "../core/events";
import { unlockConsentScripts } from "../core/scripts";
import { isExternalUrl } from "../core/url";
import type {
  BannerPosition,
  ConsentConfig,
  ConsentContent,
  ConsentDecision,
  ConsentState,
} from "../core/types";

export type CookieConsentOptions = {
  config?: Partial<ConsentConfig>;
  content?: Partial<ConsentContent>;
  position?: BannerPosition;
  /** Extra class on the banner root. */
  className?: string;
  /** Element the banner is appended to. Default document.body. */
  container?: HTMLElement;
  /** Push Google Consent Mode updates. Default true. */
  googleConsent?: boolean;
  /**
   * Clicks on matching elements reopen the banner. Default
   * `[data-cc-open], a[href$="#cookie-settings"]`. Pass false to disable.
   */
  openSelector?: string | false;
  /**
   * Activate `<script type="text/plain" data-cookie-consent>` tags once
   * tracking is allowed. Default true.
   */
  unlockScripts?: boolean;
  /** Called after every decision. */
  onChange?: (state: ConsentState) => void;
};

export type CookieConsentInstance = {
  getState(): ConsentState;
  isGranted(): boolean;
  open(options?: { focus?: boolean }): void;
  close(): void;
  accept(): void;
  reject(): void;
  destroy(): void;
};

export const DEFAULT_OPEN_SELECTOR = '[data-cc-open], a[href$="#cookie-settings"]';

export function createCookieConsent(options: CookieConsentOptions = {}): CookieConsentInstance {
  const config: ConsentConfig = { ...DEFAULT_CONFIG, ...options.config };
  const content: ConsentContent = { ...DEFAULT_CONTENT, ...options.content };
  const position = options.position ?? DEFAULT_POSITION;
  const openSelector = options.openSelector === undefined ? DEFAULT_OPEN_SELECTOR : options.openSelector;

  let state = readClientConsent(config.cookieName, config.version);
  let root: HTMLElement | null = null;

  const unlock = () => {
    if (options.unlockScripts !== false && isConsentGranted(state, config.mode)) unlockConsentScripts();
  };

  const decide = (decision: ConsentDecision) => {
    state = commitDecision(config, decision, { googleConsent: options.googleConsent });
    close();
    unlock();
    options.onChange?.(state);
  };

  function open(opts: { focus?: boolean } = {}) {
    if (!root) {
      root = buildBanner(content, position, options.className, {
        accept: () => decide("accepted"),
        reject: () => decide("rejected"),
      });
      (options.container ?? document.body).appendChild(root);
    }
    if (opts.focus) root.querySelector<HTMLButtonElement>(".cc-btn")?.focus();
  }

  function close() {
    root?.remove();
    root = null;
  }

  const onOpenEvent = () => open({ focus: true });
  const onDocumentClick = (e: MouseEvent) => {
    if (!openSelector) return;
    const target = (e.target as Element | null)?.closest?.(openSelector);
    if (!target) return;
    e.preventDefault();
    open({ focus: true });
  };

  window.addEventListener(CONSENT_OPEN_EVENT, onOpenEvent);
  document.addEventListener("click", onDocumentClick);

  if (state.decision === null) open();
  unlock();

  return {
    getState: () => state,
    isGranted: () => isConsentGranted(state, config.mode),
    open,
    close,
    accept: () => decide("accepted"),
    reject: () => decide("rejected"),
    destroy() {
      close();
      window.removeEventListener(CONSENT_OPEN_EVENT, onOpenEvent);
      document.removeEventListener("click", onDocumentClick);
    },
  };
}

/** Builds the banner markup. Mirrors react/CookieBanner so one stylesheet fits both. */
function buildBanner(
  content: ConsentContent,
  position: BannerPosition,
  className: string | undefined,
  actions: { accept: () => void; reject: () => void }
): HTMLElement {
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string) => {
    const node = document.createElement(tag);
    node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const root = el("div", `cc-banner cc-banner--${position}${className ? ` ${className}` : ""}`);
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-live", "polite");
  root.setAttribute("aria-label", content.title || "Cookie consent");

  const textWrap = el("div", "cc-text");
  if (content.title) textWrap.appendChild(el("p", "cc-title", content.title));
  const body = el("p", "cc-body", content.body);
  if (content.policyUrl) {
    body.appendChild(document.createTextNode(" "));
    const link = el("a", "cc-policy", content.policyLabel || "Learn more");
    link.href = content.policyUrl;
    if (isExternalUrl(content.policyUrl)) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    body.appendChild(link);
  }
  textWrap.appendChild(body);

  const actionsWrap = el("div", "cc-actions");
  const reject = el("button", "cc-btn cc-btn--reject", content.rejectLabel);
  reject.type = "button";
  reject.addEventListener("click", actions.reject);
  const accept = el("button", "cc-btn cc-btn--accept", content.acceptLabel);
  accept.type = "button";
  accept.addEventListener("click", actions.accept);
  actionsWrap.append(reject, accept);

  root.append(textWrap, actionsWrap);
  return root;
}

export { unlockConsentScripts } from "../core/scripts";
export { openConsentBanner, onConsentChange, CONSENT_OPEN_EVENT, CONSENT_CHANGE_EVENT } from "../core/events";
export type { BannerPosition, ConsentConfig, ConsentContent, ConsentState } from "../core/types";
