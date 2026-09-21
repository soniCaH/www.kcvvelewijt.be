"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Button } from "@/components/design-system/Button";
import { X } from "@/lib/icons.redesign";

export interface NavTakeoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Wordmark slot (rendered top-left, same height as the closed header bar).
   */
  wordmark: ReactNode;
  /**
   * Composed nav items + hero CTA via `<NavTakeoverItem>` + `<Button>`.
   */
  children: ReactNode;
  /**
   * Element to return focus to on close (typically the hamburger button).
   */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  /**
   * Focus target used only when the panel closes *itself* because the
   * viewport crossed into the `lg` desktop layout (#2850) — at that width
   * `returnFocusRef` (the hamburger) is `lg:hidden`, so focusing it would
   * land focus on a hidden element, which is worse than the bug this fixes.
   * Typically the desktop nav row's first link. Omitted, focus simply lands
   * wherever the browser puts it once this panel unmounts (`document.body`).
   */
  autoCloseFocusRef?: React.RefObject<HTMLElement | null>;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Tailwind v4 only emits a `@theme` variable into `:root` for a name its
 * source scanner sees used somewhere in a file it scans — on `main`,
 * `globals.css` is the only file naming `--breakpoint-lg`, and Tailwind does
 * NOT emit it there. It reaches the DOM at all (confirmed against this
 * branch's own `.next` build output) only because this exact string literal
 * also appears here, which the scanner treats as a second "use" of the
 * token. **Keep it a literal, in a file under Tailwind's content scan**
 * (`apps/web/src/**`) — building it dynamically (e.g. `"--breakpoint-" +
 * name`) or moving it into a constant in a file Tailwind doesn't scan would
 * silently stop the emission, and the auto-close below would go quiet with
 * no failing test (#2850 review finding F1).
 *
 * Returns `null` — rather than guessing a number — when the property can't
 * be read as a trustworthy pixel value: empty (no stylesheet loaded, e.g.
 * under vitest/happy-dom) or a non-`px` unit (`rem`, `em`, unitless, …),
 * which `parseFloat` would otherwise silently mis-parse (`"64rem"` →
 * `64`, not `1024`). Callers treat `null` as "unknown" and skip the
 * auto-close rather than guess — a wrong guess would close the drawer the
 * instant it opens on every phone, which is worse than never auto-closing.
 */
function readBreakpointLgPx(): number | null {
  const raw = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--breakpoint-lg")
    .trim();
  if (!raw.endsWith("px")) return null;
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Re-derives "is the viewport currently at/above `lg`" fresh, rather than
 * remembering *why* a close happened — see the focus-return effect below,
 * which needs this to answer correctly for every way the panel can close
 * (Escape, the ✕, a nav tap, or the breakpoint effect itself), not only the
 * one path this file controls.
 */
function isDesktopViewport(): boolean {
  const breakpointLgPx = readBreakpointLgPx();
  if (breakpointLgPx === null) return false;
  return (
    window.matchMedia?.(`(min-width: ${breakpointLgPx}px)`)?.matches ?? false
  );
}

export const NavTakeover = ({
  open,
  onOpenChange,
  wordmark,
  children,
  returnFocusRef,
  autoCloseFocusRef,
}: NavTakeoverProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables =
      panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusables?.[0]?.focus();

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  // Below `lg` this panel is the only nav; at `lg` the desktop row takes
  // over and nothing else retires it (#2850) — a visitor who opens the
  // drawer on a narrow window and then widens it (or rotates a tablet) got
  // both navs on screen at once. A `matchMedia` listener resetting `open`
  // is deliberate over an `lg:hidden` class on this panel: CSS alone would
  // still leave `open` — and the scroll lock / focus trap it drives above —
  // armed while merely invisible, so the panel would silently reappear the
  // next time the viewport narrowed back past `lg`. Only listens while
  // actually open, so it costs nothing while closed.
  //
  // Checks the CURRENT match immediately, not only future `change` events
  // (mirrors `useIsPhoneViewport` in `CalendarWidget.tsx` and the
  // phone-check effect in `OrganigramExplorer.tsx`) — a page can come out
  // of the back/forward cache already at/above `lg` with this panel already
  // open (rotate a tablet, follow a link, press Back), and a listener that
  // only reacts to a `change` event would never fire for a state that was
  // already true the moment it subscribed.
  useEffect(() => {
    if (!open) return;

    const breakpointLgPx = readBreakpointLgPx();
    if (breakpointLgPx === null) return;

    const mq = window.matchMedia(`(min-width: ${breakpointLgPx}px)`);
    const closeIfDesktop = () => {
      if (mq.matches) onOpenChange(false);
    };
    closeIfDesktop();
    mq.addEventListener("change", closeIfDesktop);
    return () => mq.removeEventListener("change", closeIfDesktop);
  }, [open, onOpenChange]);

  // Track the previous `open` value so we only return focus on a true→false
  // transition. Without this guard the effect would fire on initial mount with
  // `open === false`, stealing focus from the trigger as soon as the page loads.
  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (prevOpenRef.current && !open) {
      // `returnFocusRef` (the hamburger) is `lg:hidden` at/above `lg`, so it
      // cannot receive focus there. Re-checking the viewport here — instead
      // of remembering *why* this particular close happened, e.g. via a ref
      // set by the effect above — means the right target is picked
      // regardless of what caused the close (Escape, the ✕, a nav tap, or
      // the breakpoint effect itself), and can never go stale the way such
      // a ref could if a caller ever ignored one `onOpenChange(false)` call
      // (#2850 review finding F7).
      if (isDesktopViewport()) {
        autoCloseFocusRef?.current?.focus();
      } else {
        returnFocusRef?.current?.focus();
      }
    }
    prevOpenRef.current = open;
  }, [open, returnFocusRef, autoCloseFocusRef]);

  const handleTabTrap = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((el) => !el.hasAttribute("data-focus-skip"));
    if (focusables.length === 0) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      id="nav-takeover"
      role="dialog"
      aria-modal="true"
      aria-label="Navigatiemenu"
      onKeyDown={handleTabTrap}
      className="bg-cream fixed inset-0 z-[60] flex flex-col"
    >
      {/* Top bar — same height as the closed header */}
      <div className="border-paper-edge flex h-16 shrink-0 items-center justify-between border-b px-4 lg:px-8">
        <div className="flex items-center">{wordmark}</div>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Sluit menu"
          onClick={() => onOpenChange(false)}
          className="min-h-11 min-w-11 !px-2 !py-2"
        >
          <X size={20} aria-hidden="true" />
        </Button>
      </div>

      <nav
        aria-label="Hoofdnavigatie"
        className="flex flex-1 flex-col overflow-y-auto px-4 py-4 lg:px-8"
      >
        {children}
      </nav>
    </div>
  );
};
