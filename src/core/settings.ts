import { DEFAULT_CONFIG, DEFAULT_CONTENT, DEFAULT_POSITION } from "./config";
import { sanitizeHexColor } from "./theme";
import type {
  BannerPosition,
  ConsentConfig,
  ConsentContent,
  ConsentTheme,
  ResolvedConsent,
  WpConsentSettings,
} from "./types";

// Empty CMS strings should fall back, not render blank.
const text = (v: string | null | undefined, fallback?: string): string | undefined =>
  typeof v === "string" && v.trim() ? v : fallback;

const positiveInt = (v: number | null | undefined, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback;

const POSITIONS: BannerPosition[] = ["bar", "box-left", "box-right"];

export type ResolveOverrides = {
  /** Values used when the CMS field is empty (project-level defaults). */
  config?: Partial<ConsentConfig>;
  content?: Partial<ConsentContent>;
  position?: BannerPosition;
  theme?: ConsentTheme;
};

/**
 * Turn raw WordPress settings (REST or GraphQL) into a ready-to-use
 * config + content pair. Safe with `null` — e.g. when WordPress is unreachable.
 */
export function resolveConsentSettings(
  settings?: WpConsentSettings | null,
  fallbacks: ResolveOverrides = {}
): ResolvedConsent {
  const s = settings ?? {};
  const baseConfig = { ...DEFAULT_CONFIG, ...fallbacks.config };
  const baseContent = { ...DEFAULT_CONTENT, ...fallbacks.content };

  const mode = s.mode === "opt-in" || s.mode === "opt-out" ? s.mode : baseConfig.mode;
  const cookieDomain = text(s.cookieDomain, baseConfig.cookieDomain);

  const config: ConsentConfig = {
    cookieName: text(s.cookieName, baseConfig.cookieName)!,
    mode,
    version: positiveInt(s.version, baseConfig.version),
    expiryDays: positiveInt(s.expiryDays, baseConfig.expiryDays),
    ...(cookieDomain ? { cookieDomain } : {}),
  };

  const content: ConsentContent = {
    title: text(s.bannerTitle, baseContent.title),
    body: text(s.bannerText, baseContent.body)!,
    acceptLabel: text(s.acceptLabel, baseContent.acceptLabel)!,
    rejectLabel: text(s.rejectLabel, baseContent.rejectLabel)!,
    policyUrl: text(s.policyUrl, baseContent.policyUrl),
    policyLabel: text(s.policyLabel, baseContent.policyLabel),
    manageLabel: text(s.manageLabel, baseContent.manageLabel),
  };

  const position = POSITIONS.includes(s.position as BannerPosition)
    ? (s.position as BannerPosition)
    : fallbacks.position ?? DEFAULT_POSITION;

  const t = fallbacks.theme ?? {};
  const theme: ConsentTheme = {};
  const background = sanitizeHexColor(s.colorBackground) ?? sanitizeHexColor(t.background);
  const textColor = sanitizeHexColor(s.colorText) ?? sanitizeHexColor(t.text);
  const accent = sanitizeHexColor(s.colorAccent) ?? sanitizeHexColor(t.accent);
  const accentText = sanitizeHexColor(s.colorAccentText) ?? sanitizeHexColor(t.accentText);
  if (background) theme.background = background;
  if (textColor) theme.text = textColor;
  if (accent) theme.accent = accent;
  if (accentText) theme.accentText = accentText;

  return { config, content, position, theme };
}
