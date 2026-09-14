import { afterEach, describe, expect, it, vi } from "vitest";
import {
  commitDecision,
  consentDefaultInlineScript,
  DEFAULT_CONFIG,
  fetchConsentSettings,
  isConsentGranted,
  parseConsent,
  readClientConsent,
  resolveConsentSettings,
  serializeConsent,
  themeToCssVars,
  updateGoogleConsent,
  CONSENT_CHANGE_EVENT,
} from "../src";

type DL = { dataLayer?: unknown[]; gtag?: unknown };

const clearCookies = () => {
  for (const c of document.cookie.split("; ")) {
    const name = c.split("=")[0];
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
};

afterEach(() => {
  clearCookies();
  delete (window as DL).dataLayer;
  delete (window as DL).gtag;
});

describe("cookie", () => {
  it("round-trips a decision", () => {
    expect(parseConsent(serializeConsent("accepted", 3), 3)).toEqual({ decision: "accepted", version: 3 });
  });

  it("ignores stale versions and junk", () => {
    expect(parseConsent("accepted.1", 2).decision).toBeNull();
    expect(parseConsent("maybe.1", 1).decision).toBeNull();
    expect(parseConsent(undefined, 1).decision).toBeNull();
  });

  it("commitDecision writes the cookie and broadcasts", () => {
    const listener = vi.fn();
    window.addEventListener(CONSENT_CHANGE_EVENT, listener);
    const state = commitDecision(DEFAULT_CONFIG, "rejected");
    window.removeEventListener(CONSENT_CHANGE_EVENT, listener);

    expect(state).toEqual({ decision: "rejected", version: 1 });
    expect(readClientConsent("cookie_consent", 1).decision).toBe("rejected");
    expect((listener.mock.calls[0]![0] as CustomEvent).detail).toEqual(state);
  });
});

describe("isConsentGranted", () => {
  it("follows mode when undecided", () => {
    expect(isConsentGranted({ decision: null, version: 1 }, "opt-out")).toBe(true);
    expect(isConsentGranted({ decision: null, version: 1 }, "opt-in")).toBe(false);
    expect(isConsentGranted({ decision: "rejected", version: 1 }, "opt-out")).toBe(false);
    expect(isConsentGranted({ decision: "accepted", version: 1 }, "opt-in")).toBe(true);
  });
});

describe("Google Consent Mode", () => {
  const lastCommand = () => {
    const dl = (window as DL).dataLayer!;
    return Array.from(dl[dl.length - 1] as IArguments);
  };

  it("pushes arguments objects, not arrays", () => {
    updateGoogleConsent(true);
    const entry = (window as DL).dataLayer![0];
    expect(Array.isArray(entry)).toBe(false);
    expect(Object.prototype.toString.call(entry)).toBe("[object Arguments]");
    expect(lastCommand()).toEqual([
      "consent",
      "update",
      { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" },
    ]);
  });

  it("inline default script is self-contained and reads the cookie", () => {
    const run = (mode: "opt-in" | "opt-out") => {
      delete (window as DL).dataLayer;
      new Function(consentDefaultInlineScript({ cookieName: "cc", version: 2, mode }))();
      return lastCommand();
    };

    expect(run("opt-in")[2]).toMatchObject({ analytics_storage: "denied", wait_for_update: 500 });
    expect(run("opt-out")[2]).toMatchObject({ analytics_storage: "granted" });

    document.cookie = "cc=accepted.2; Path=/";
    expect(run("opt-in")[2]).toMatchObject({ ad_storage: "granted" });

    document.cookie = "cc=rejected.2; Path=/";
    expect(run("opt-out")[2]).toMatchObject({ ad_storage: "denied" });

    document.cookie = "cc=rejected.1; Path=/"; // stale version
    expect(run("opt-out")[2]).toMatchObject({ ad_storage: "granted" });
  });
});

describe("resolveConsentSettings", () => {
  it("falls back for null / empty CMS values", () => {
    const { config, content, position } = resolveConsentSettings({
      bannerText: "  ",
      acceptLabel: "OK",
      mode: "nonsense",
      version: 0,
      position: "box-right",
    });
    expect(content.body).toBe("We use cookies to analyze traffic and improve your experience.");
    expect(content.acceptLabel).toBe("OK");
    expect(config.mode).toBe("opt-in");
    expect(config.version).toBe(1);
    expect(position).toBe("box-right");
  });

  it("uses project fallbacks", () => {
    const { config } = resolveConsentSettings(null, { config: { mode: "opt-out" } });
    expect(config.mode).toBe("opt-out");
    expect(config).not.toHaveProperty("cookieDomain");
  });
});

describe("googleConsent", () => {
  it("follows the WordPress setting, defaulting to on", () => {
    expect(resolveConsentSettings(null).googleConsent).toBe(true);
    expect(resolveConsentSettings({ googleConsentMode: false }).googleConsent).toBe(false);
    expect(resolveConsentSettings({ googleConsentMode: true }, { googleConsent: false }).googleConsent).toBe(true);
    expect(resolveConsentSettings({}, { googleConsent: false }).googleConsent).toBe(false);
  });
});

describe("theme", () => {
  it("resolves CMS colours, ignoring invalid values", () => {
    const { theme } = resolveConsentSettings({
      colorBackground: "#ffffff",
      colorText: "#111",
      colorAccent: "red; background: url(x)",
      colorAccentText: "",
    });
    expect(theme).toEqual({ background: "#ffffff", text: "#111" });
  });

  it("falls back to project theme, CMS wins", () => {
    const { theme } = resolveConsentSettings(
      { colorAccent: "#ff0000" },
      { theme: { accent: "#00ff00", background: "#000000" } }
    );
    expect(theme).toEqual({ accent: "#ff0000", background: "#000000" });
  });

  it("derives secondary tones from the text colour", () => {
    expect(themeToCssVars({ text: "#222222", accent: "#ff3300" })).toEqual({
      "--cc-fg": "#222222",
      "--cc-link": "#222222",
      "--cc-muted": "color-mix(in srgb, #222222 72%, transparent)",
      "--cc-border": "color-mix(in srgb, #222222 12%, transparent)",
      "--cc-border-strong": "color-mix(in srgb, #222222 28%, transparent)",
      "--cc-reject-hover": "color-mix(in srgb, #222222 8%, transparent)",
      "--cc-accent": "#ff3300",
    });
    expect(themeToCssVars({})).toEqual({});
    expect(themeToCssVars(undefined)).toEqual({});
  });
});

describe("fetchConsentSettings", () => {
  it("calls the REST route and resolves null on failure", async () => {
    const ok = vi.fn(async () => new Response(JSON.stringify({ mode: "opt-out" }), { status: 200 }));
    await expect(fetchConsentSettings({ wordpressUrl: "https://cms.test/", fetch: ok })).resolves.toEqual({
      mode: "opt-out",
    });
    expect(ok).toHaveBeenCalledWith(
      "https://cms.test/wp-json/20twenty-cookie-consent/v1/settings",
      expect.objectContaining({ method: "GET" })
    );

    const fail = vi.fn(async () => new Response("nope", { status: 500 }));
    await expect(fetchConsentSettings({ wordpressUrl: "https://cms.test", fetch: fail })).resolves.toBeNull();
  });

  it("supports GraphQL", async () => {
    const gql = vi.fn(
      async () => new Response(JSON.stringify({ data: { cookieConsentSettings: { version: 4 } } }), { status: 200 })
    );
    await expect(
      fetchConsentSettings({ wordpressUrl: "https://cms.test", transport: "graphql", fetch: gql })
    ).resolves.toEqual({ version: 4 });
    expect(gql).toHaveBeenCalledWith("https://cms.test/graphql", expect.objectContaining({ method: "POST" }));
  });
});
