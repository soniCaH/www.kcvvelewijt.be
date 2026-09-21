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

/** Fallback for `--breakpoint-lg` under vitest/happy-dom, where no
 *  stylesheet is loaded. The token itself (`globals.css`) is the real
 *  source of truth — the two `lg:` Tailwind variants already in this file's
 *  siblings derive from it, and so does the auto-close below. */
const FALLBACK_BREAKPOINT_LG_PX = 1024;

/** Reads `--breakpoint-lg` off the DOM so the auto-close effect below never
 *  repeats the number Tailwind's own `lg:` variants already derive it from. */
function getBreakpointLgPx(): number {
  const raw = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--breakpoint-lg")
    .trim();
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : FALLBACK_BREAKPOINT_LG_PX;
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
  const closedByBreakpointRef = useRef(false);
  useEffect(() => {
    if (!open) return;

    const mq = window.matchMedia(`(min-width: ${getBreakpointLgPx()}px)`);
    const closeOnDesktop = (e: MediaQueryListEvent) => {
      if (!e.matches) return;
      closedByBreakpointRef.current = true;
      onOpenChange(false);
    };
    mq.addEventListener("change", closeOnDesktop);
    return () => mq.removeEventListener("change", closeOnDesktop);
  }, [open, onOpenChange]);

  // Track the previous `open` value so we only return focus on a true→false
  // transition. Without this guard the effect would fire on initial mount with
  // `open === false`, stealing focus from the trigger as soon as the page loads.
  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (prevOpenRef.current && !open) {
      // The breakpoint effect above sets this ref synchronously, just before
      // it calls `onOpenChange` — so by the time this effect runs, it can
      // tell "the user closed it" from "the viewport grew past `lg` while it
      // was open" apart, and send focus to `autoCloseFocusRef` instead of
      // the now-hidden `returnFocusRef` trigger for the latter.
      if (closedByBreakpointRef.current) {
        closedByBreakpointRef.current = false;
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
