import { useSyncExternalStore } from "react";

// The "Manage cookies" label comes from the CMS with the banner content, but
// the reopen button usually lives in a footer outside <ConsentProvider>.
// CookieBanner publishes the label here; any ManageConsentButton reads it.

let label: string | undefined;
const listeners = new Set<() => void>();

export function setManageLabel(next: string | undefined): void {
  if (next === label) return;
  label = next;
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** The CMS "Manage cookies" label once a CookieBanner has mounted, else undefined. */
export function useManageLabel(): string | undefined {
  return useSyncExternalStore(
    subscribe,
    () => label,
    () => undefined
  );
}
