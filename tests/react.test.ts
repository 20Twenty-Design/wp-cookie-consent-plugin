import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { ConsentProvider, CookieBanner, ManageConsentButton } from "../src/react";
import { DEFAULT_CONFIG } from "../src/core/config";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  document.body.innerHTML = "";
  document.cookie = "cookie_consent=; Max-Age=0; Path=/";
});

const tree = (theme?: Record<string, string>) =>
  createElement(ConsentProvider, {
    config: DEFAULT_CONFIG,
    disableGoogleConsent: true,
    children: createElement(CookieBanner, {
      content: { body: "Hi", acceptLabel: "OK", rejectLabel: "No" },
      position: "box-left",
      theme,
    }),
  });

describe("React CookieBanner", () => {
  it("renders nothing during SSR", () => {
    expect(renderToStaticMarkup(tree())).toBe("");
  });

  it("mounts with position and theme variables", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => root.render(tree({ background: "#fafafa", text: "#111111" })));

    const banner = container.querySelector<HTMLElement>(".cc-banner")!;
    expect(banner.classList.contains("cc-banner--box-left")).toBe(true);
    expect(banner.style.getPropertyValue("--cc-bg")).toBe("#fafafa");
    expect(banner.style.getPropertyValue("--cc-muted")).toContain("#111111");

    await act(async () => banner.querySelector<HTMLButtonElement>(".cc-btn--accept")!.click());
    expect(container.querySelector(".cc-banner")).toBeNull();
    expect(document.cookie).toContain("cookie_consent=accepted.1");
    root.unmount();
  });

  it("ManageConsentButton outside the provider uses the WordPress label", async () => {
    document.cookie = "cookie_consent=accepted.1; Path=/";
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const page = (children?: string) =>
      createElement("div", null, [
        createElement(ConsentProvider, {
          key: "provider",
          config: DEFAULT_CONFIG,
          disableGoogleConsent: true,
          children: createElement(CookieBanner, {
            content: { body: "Hi", acceptLabel: "OK", rejectLabel: "No", manageLabel: "Do Not Sell My Info" },
          }),
        }),
        createElement("footer", { key: "footer" }, createElement(ManageConsentButton, { children })),
      ]);

    await act(async () => root.render(page()));
    const button = () => container.querySelector<HTMLButtonElement>("footer .cc-manage");
    expect(button()!.textContent).toBe("Do Not Sell My Info");

    await act(async () => root.render(page("Custom")));
    expect(button()!.textContent).toBe("Custom");

    await act(async () => button()!.click());
    expect(container.querySelector(".cc-banner")).not.toBeNull();
    root.unmount();
  });
});

describe("ConsentProvider unlockScripts", () => {
  const optOut = { ...DEFAULT_CONFIG, mode: "opt-out" as const };
  const gated = () => {
    const s = document.createElement("script");
    s.type = "text/plain";
    s.setAttribute("data-cookie-consent", "");
    s.text = "window.__ccRan = true;";
    document.head.appendChild(s);
  };
  const mount = async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () =>
      root.render(
        createElement(ConsentProvider, { config: optOut, disableGoogleConsent: true, unlockScripts: true, children: null })
      )
    );
    return root;
  };

  afterEach(() => {
    document.head.querySelectorAll("script").forEach((s) => s.remove());
  });

  it("opt-out: does not unlock scripts for a visitor who already declined", async () => {
    document.cookie = "cookie_consent=rejected.1; Path=/";
    gated();
    const root = await mount();
    expect(document.head.querySelector("script[data-cc-unlocked]")).toBeNull();
    root.unmount();
  });

  it("removes leftover tracking cookies on mount for a visitor who declined", async () => {
    document.cookie = "cookie_consent=rejected.1; Path=/";
    document.cookie = "_ga=x; Path=/";
    const root = await mount();
    expect(document.cookie).not.toContain("_ga=");
    root.unmount();
  });

  it("opt-out: unlocks scripts for an undecided visitor", async () => {
    gated();
    const root = await mount();
    expect(document.head.querySelector("script[data-cc-unlocked]")).not.toBeNull();
    root.unmount();
  });
});
