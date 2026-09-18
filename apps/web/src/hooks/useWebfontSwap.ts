"use client";

import { useEffect, useRef } from "react";

/**
 * Fires `onSwap` after a webfont swap — via TWO complementary signals.
 * Both exist on purpose; do not delete either without re-reading this
 * docblock (a prior version of this hook shipped with only the first,
 * which regressed `TeamSectionNav`'s scroll-arrow geometry in VR — #2822
 * follow-up, confirmed in a real Chromium: `fonts.ready` resolves in ~1ms
 * even with nothing loading, while `loadingdone` fired 0 times in the same
 * window when no load batch ever occurred).
 *
 * 1. **`loadingdone`** (the `FontFaceSet` event) — the AUTHORITATIVE signal
 *    for a real swap. `document.fonts.ready` resolving is not proof a swap
 *    happened: it can report "loaded" for an already-cached fallback face
 *    well before the real webfont's own network fetch even starts (measured
 *    on `/jeugd#visie` — `fonts.ready` was already "loaded" at t≈0ms, then
 *    flipped back to "loading" and only genuinely settled at t≈600ms once
 *    Freight itself — loaded asynchronously via Adobe Typekit — actually
 *    swapped in and reflowed the content). `loadingdone` fires for every
 *    such batch, including the one that matters, for as long as this hook
 *    stays mounted.
 *
 * 2. **`document.fonts.ready`** — a FLOOR, not a second source of truth.
 *    `loadingdone` only fires when an actual load batch completes; if the
 *    font set is already fully settled when this hook mounts (e.g. a later
 *    Storybook story reusing a session whose Typekit faces an earlier
 *    story already resolved — the exact VR failure this restores), no
 *    batch ever occurs and `loadingdone` never fires. `ready` is a promise
 *    that resolves regardless, so it guarantees `onSwap` still runs once.
 *    This does NOT reintroduce the bug (1) describes: `ready` can still
 *    resolve for a not-yet-real swap, but `loadingdone` stays wired and
 *    WILL still fire for the real, later swap regardless of what `ready`
 *    did — every consumer here is idempotent against an extra/early call
 *    (a re-measure, a re-fit, a rescale; `useHashLandingCorrection.correct`
 *    additionally no-ops outside its armed window), so a spurious early
 *    floor call costs nothing.
 *
 * This is the ONE place in `apps/web/src` that registers either trigger —
 * every consumer that needs to re-measure after a webfont swap (a hash
 * landing correction, a scroll-hint overflow measurement, a share-image
 * text auto-fit, a print-scale calculation) goes through this hook rather
 * than adding its own `document.fonts` listener.
 *
 * SSR-safe and defensive: `document.fonts` can be absent, guarded via
 * optional chaining. Both subscriptions are torn down on unmount (the
 * `ready` promise itself can't be "cancelled", but `onSwapRef` below is
 * refreshed by every render and the effect's cleanup only removes the
 * `loadingdone` listener — a `ready` resolution that lands after unmount
 * still calls the latest `onSwap`, same as any other resolved promise
 * continuation on an unmounted component; every consumer here is a no-op
 * or a ref write in that case, never a render).
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
    document.fonts?.ready?.then(() => onSwapRef.current()).catch(() => {});
    return () => {
      document.fonts?.removeEventListener?.("loadingdone", handleLoadingDone);
    };
  }, []);
}
