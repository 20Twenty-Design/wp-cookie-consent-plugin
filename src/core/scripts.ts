/**
 * Activates blocked scripts once tracking is allowed, e.g.
 *   <script type="text/plain" data-cookie-consent src="https://…/pixel.js"></script>
 * Each script is swapped for a live clone exactly once. Use `data-type` to set
 * the live script's type (e.g. "module").
 */
export function unlockConsentScripts(scope: ParentNode = document): void {
  if (typeof document === "undefined") return;
  scope
    .querySelectorAll<HTMLScriptElement>('script[type="text/plain"][data-cookie-consent]:not([data-cc-unlocked])')
    .forEach((blocked) => {
      const live = document.createElement("script");
      for (const attr of Array.from(blocked.attributes)) {
        if (attr.name !== "type" && attr.name !== "data-type") live.setAttribute(attr.name, attr.value);
      }
      const type = blocked.getAttribute("data-type");
      if (type) live.type = type;
      live.setAttribute("data-cc-unlocked", "");
      live.text = blocked.text;
      blocked.setAttribute("data-cc-unlocked", "");
      blocked.replaceWith(live);
    });
}
