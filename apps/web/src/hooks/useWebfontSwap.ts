"use client";

import { useEffect, useRef } from "react";

/**
 * Fires `onSwap` once the browser's real webfont swap completes — the
 * `FontFaceSet` `loadingdone` event, **not** `document.fonts.ready`.
 *
 * `ready` resolves too early: it can report "loaded" for an already-cached
 * fallback face well before the real webfont's own network fetch even
 * starts (measured on `/jeugd#visie` — `fonts.ready` was already "loaded"
 * at t≈0ms, then flipped back to "loading" and only genuinely settled at
 * t≈600ms once Freight itself — loaded asynchronously via Adobe Typekit —
 * actually swapped in and reflowed the content). `loadingdone` fires for
 * every such batch, including the one that matters, for as long as this
 * hook stays mounted.
 *
 * This is the ONE place in `apps/web/src` that registers the trigger —
 * every consumer that needs to re-measure after a webfont swap (a hash
 * landing correction, a scroll-hint overflow measurement, a share-image
 * text auto-fit, a print-scale calculation) goes through this hook rather
 * than adding its own `document.fonts` listener.
 *
 * SSR-safe and defensive: `document.fonts` can be absent, guarded via
 * optional chaining. The listener is removed on unmount.
 *
 * `onSwap` is held in a ref refreshed each render, so the listener
 * subscribes **once** — consumers may pass an inline callback without
 * `useCallback` and never get a stale closure or a re-subscribe churn.
 */
export function useWebfontSwap(onSwap: () => void): void {
  const onSwapRef = useRef(onSwap);
  useEffect(() => {
    onSwapRef.current = onSwap;
  });

  useEffect(() => {
    const handleLoadingDone = () => onSwapRef.current();
    document.fonts?.addEventListener?.("loadingdone", handleLoadingDone);
    return () => {
      document.fonts?.removeEventListener?.("loadingdone", handleLoadingDone);
    };
  }, []);
}
