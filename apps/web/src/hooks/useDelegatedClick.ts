"use client";

import { useEffect, useRef, type RefObject } from "react";

export interface UseDelegatedClickOptions {
  /** CSS selector resolved from the click target via `closest()`. */
  selector: string;
  /** Invoked with the matched element when a click resolves to `selector`. */
  onMatch: (el: HTMLElement) => void;
}

/**
 * Delegate clicks within a container to the nearest element matching
 * `selector`. One native `click` listener on `ref.current` (not per-child
 * `onClick`) resolves `event.target.closest(selector)`, early-returns when
 * nothing matches, and invokes `onMatch` with the matched element — so the
 * content beneath the container can stay server-rendered.
 *
 * The hook is analytics-agnostic: it does delegation only. The consumer's
 * `onMatch` owns every `data-*` read, branch, hash, and `trackEvent` call.
 *
 * `onMatch` is held in a ref refreshed each render, so the listener subscribes
 * **once** (deps `[ref, selector]`) — consumers may pass an inline `onMatch`
 * without `useCallback` and never get a stale closure or a re-subscribe churn.
 * SSR-safe: the listener is wired in an effect and guards a null `ref.current`.
 */
export function useDelegatedClick(
  ref: RefObject<HTMLElement | null>,
  { selector, onMatch }: UseDelegatedClickOptions,
): void {
  // Keep the latest callback out of the effect deps so a new `onMatch` identity
  // never re-subscribes the listener. The sync runs after every render, before
  // any click can read it.
  const onMatchRef = useRef(onMatch);
  useEffect(() => {
    onMatchRef.current = onMatch;
  });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>(selector);
      if (!el) return;
      onMatchRef.current(el);
    };

    node.addEventListener("click", handleClick);
    return () => node.removeEventListener("click", handleClick);
  }, [ref, selector]);
}
