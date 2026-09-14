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
