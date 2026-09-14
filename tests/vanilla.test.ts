import { afterEach, describe, expect, it } from "vitest";
import { createCookieConsent, openConsentBanner } from "../src/vanilla";
import type { CookieConsentInstance } from "../src/vanilla";

let instance: CookieConsentInstance | undefined;

afterEach(() => {
  instance?.destroy();
  instance = undefined;
  document.body.innerHTML = "";
  document.cookie = "cookie_consent=; Max-Age=0; Path=/";
});

const banner = () => document.querySelector(".cc-banner");

describe("createCookieConsent", () => {
  it("shows the banner for undecided visitors and stores the choice", () => {
    instance = createCookieConsent({
      content: { title: "Cookies", policyUrl: "/privacy" },
      position: "box-left",
      googleConsent: false,
    });

    expect(banner()).not.toBeNull();
    expect(banner()!.classList.contains("cc-banner--box-left")).toBe(true);
    expect(banner()!.querySelector(".cc-title")!.textContent).toBe("Cookies");
    expect(banner()!.querySelector("a.cc-policy")!.getAttribute("target")).toBeNull();

    banner()!.querySelector<HTMLButtonElement>(".cc-btn--accept")!.click();

    expect(banner()).toBeNull();
    expect(document.cookie).toContain("cookie_consent=accepted.1");
    expect(instance.getState().decision).toBe("accepted");
  });

  it("stays hidden once decided and reopens on demand", () => {
    document.cookie = "cookie_consent=rejected.1; Path=/";
    document.body.innerHTML = '<a href="#cookie-settings" id="menu">Cookie settings</a>';
    instance = createCookieConsent({ googleConsent: false });

    expect(banner()).toBeNull();

    document.getElementById("menu")!.click();
    expect(banner()).not.toBeNull();
    expect(document.activeElement?.classList.contains("cc-btn")).toBe(true);

    instance.close();
    openConsentBanner();
    expect(banner()).not.toBeNull();
  });

  it("re-prompts after a version bump", () => {
    document.cookie = "cookie_consent=accepted.1; Path=/";
    instance = createCookieConsent({ config: { version: 2 }, googleConsent: false });
    expect(banner()).not.toBeNull();
  });

  it("renders CMS text as text, never HTML", () => {
    instance = createCookieConsent({ content: { body: '<img src=x onerror="alert(1)">' }, googleConsent: false });
    expect(banner()!.querySelector("img")).toBeNull();
    expect(banner()!.querySelector(".cc-body")!.textContent).toContain("<img");
  });

  it("unlocks blocked scripts only when allowed", () => {
    document.body.innerHTML =
      '<script type="text/plain" data-cookie-consent id="px">window.__px = (window.__px || 0) + 1;</script>';
    instance = createCookieConsent({ googleConsent: false }); // opt-in, undecided

    const blocked = () => document.querySelector('script[type="text/plain"]:not([data-cc-unlocked])');
    expect(blocked()).not.toBeNull();

    instance.accept();
    expect(blocked()).toBeNull();
    const live = document.getElementById("px") as HTMLScriptElement;
    expect(live.type).toBe("");
    expect(live.hasAttribute("data-cc-unlocked")).toBe(true);

    instance.accept(); // idempotent
    expect(document.querySelectorAll("#px")).toHaveLength(1);
  });
});
