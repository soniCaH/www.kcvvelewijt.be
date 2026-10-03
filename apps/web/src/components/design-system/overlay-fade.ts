/**
 * The close of an overlay panel (#3389, decided in #2497): the panel stays
 * mounted and a CSS-only transition fades it out.
 *
 * Closed = the `hidden` attribute + `inert` + `opacity-0`; open = none of them.
 * `display` is in the transition list with `transition-discrete`
 * (`transition-behavior: allow-discrete`), so `display: none` — which Tailwind's
 * preflight writes as `[hidden] { display: none !important }` — lands only
 * after the 150ms Chrome-speed fade ends. No JS exit state, no `transitionend`:
 * under `motion-reduce:transition-none` no transition runs, `display: none`
 * lands at once, and nothing waits on an event that never fires. A browser
 * without `allow-discrete` falls back to today's hard cut.
 *
 * Only the close animates. There is no `starting:` entrance — the open is
 * instant, as before (a menu entrance is #2498's call).
 *
 * Usage: `<div {...overlayFadeAttrs(open)} className={cn(overlayFadeClasses(open), …)}>`.
 * Focus return and scroll-lock release stay keyed on `open`, so they happen when
 * the close STARTS, while the panel is still fading — `inert` already removed it
 * from the tab order and the accessibility tree.
 */
import { cn } from "@/lib/utils/cn";

export function overlayFadeAttrs(open: boolean) {
  return { hidden: !open, inert: !open };
}

/** Keep the class list a full literal: Tailwind's scanner has to see it. */
export function overlayFadeClasses(open: boolean): string {
  return cn(
    "transition-[opacity,display] transition-discrete duration-150 ease-out motion-reduce:transition-none",
    !open && "opacity-0",
  );
}
