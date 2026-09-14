// Server-only helpers. Pulls in next/headers — never import from Client Components.
import { cookies } from "next/headers";
import { parseConsent } from "../core/cookie";
import type { ConsentState } from "../core/types";

/**
 * Reads the decision on the server (opts the route into dynamic rendering).
 * Pass the result to <ConsentProvider initialState>.
 */
export async function readServerConsent(cookieName: string, version: number): Promise<ConsentState> {
  const store = await cookies();
  return parseConsent(store.get(cookieName)?.value, version);
}
