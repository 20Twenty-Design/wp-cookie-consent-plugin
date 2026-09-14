import type { ConsentTheme } from "./types";

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Returns the colour if it is a valid hex value, otherwise undefined. */
export function sanitizeHexColor(value: string | null | undefined): string | undefined {
  const v = typeof value === "string" ? value.trim() : "";
  return HEX.test(v) ? v : undefined;
}

/**
 * Theme colours as banner CSS custom properties. Mirrors Settings::css_vars()
 * in the PHP plugin. Secondary tones (muted body text, borders, hover) are
 * derived from the text colour so dark-on-light themes stay readable.
 * Unset colours produce no variable, so the site's own CSS still applies.
 */
export function themeToCssVars(theme: ConsentTheme | undefined): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!theme) return vars;

  const bg = sanitizeHexColor(theme.background);
  if (bg) vars["--cc-bg"] = bg;

  const text = sanitizeHexColor(theme.text);
  if (text) {
    vars["--cc-fg"] = text;
    vars["--cc-link"] = text;
    vars["--cc-muted"] = `color-mix(in srgb, ${text} 72%, transparent)`;
    vars["--cc-border"] = `color-mix(in srgb, ${text} 12%, transparent)`;
    vars["--cc-border-strong"] = `color-mix(in srgb, ${text} 28%, transparent)`;
    vars["--cc-reject-hover"] = `color-mix(in srgb, ${text} 8%, transparent)`;
  }

  const accent = sanitizeHexColor(theme.accent);
  if (accent) vars["--cc-accent"] = accent;

  const accentText = sanitizeHexColor(theme.accentText);
  if (accentText) vars["--cc-accent-fg"] = accentText;

  return vars;
}
