import { createContext, useContext } from "react";
import { resolvePalette, type SharePalette } from "./theme";

// A plain module, not an export of the 'use client' <ShareFrame>: a hook exported from a
// client component file reaches a Server Component as a client reference.
export const SharePaletteContext = createContext<SharePalette>(
  resolvePalette("cream", "neutral"),
);

/** Read the resolved palette of the enclosing `<ShareFrame>`. */
export function useSharePalette(): SharePalette {
  return useContext(SharePaletteContext);
}
