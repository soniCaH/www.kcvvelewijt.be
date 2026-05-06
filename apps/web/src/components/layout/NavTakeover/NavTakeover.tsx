"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/design-system/Button";
import { X } from "@/lib/icons.redesign";
import { NavTakeoverItem } from "./NavTakeoverItem";

export interface NavTakeoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Wordmark slot (rendered top-left, same height as the closed header bar).
   */
  wordmark: ReactNode;
  /**
   * Composed nav items + hero CTA via `<NavTakeover.Item>` + `<Button>`.
   */
  children: ReactNode;
  /**
   * Element to return focus to on close (typically the hamburger button).
   */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const NavTakeover = ({
  open,
  onOpenChange,
  wordmark,
  children,
  returnFocusRef,
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

  useEffect(() => {
    if (open) return;
    returnFocusRef?.current?.focus();
  }, [open, returnFocusRef]);

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
      role="dialog"
      aria-modal="true"
      aria-label="Hoofdnavigatie"
      onKeyDown={handleTabTrap}
      className={cn(
        "bg-cream fixed inset-0 z-[60] flex flex-col",
        "animate-in fade-in duration-200",
      )}
    >
      {/* Top bar — same height as the closed header */}
      <div className="border-paper-edge flex h-16 shrink-0 items-center justify-between border-b px-4 lg:px-8">
        <div className="flex items-center">{wordmark}</div>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Sluit menu"
          onClick={() => onOpenChange(false)}
          className="!px-2 !py-2"
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

NavTakeover.Item = NavTakeoverItem;
