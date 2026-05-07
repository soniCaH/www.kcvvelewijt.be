"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const OPEN_GRACE_MS = 80;
const CLOSE_GRACE_MS = 200;

// =====================================================================
// Cross-panel coordination via optional context
// =====================================================================

interface NavDropdownContextValue {
  openId: string | null;
  setOpenId: React.Dispatch<React.SetStateAction<string | null>>;
}

const NavDropdownContext = createContext<NavDropdownContextValue | null>(null);

export interface NavDropdownProviderProps {
  children: ReactNode;
  /**
   * Pre-open a specific dropdown by its `id` — used by Storybook stories and
   * tests that need to render the panel in its open state without simulating
   * hover. Production callers leave this undefined.
   */
  defaultOpenId?: string;
}

/**
 * Optional provider for cross-panel coordination — when wrapped, only one
 * `<NavDropdown>` panel is open at a time. Without a provider, each
 * `<NavDropdown>` manages its own open state independently (useful for
 * Storybook / tests).
 */
export const NavDropdownProvider = ({
  children,
  defaultOpenId,
}: NavDropdownProviderProps) => {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);
  return (
    <NavDropdownContext.Provider value={{ openId, setOpenId }}>
      {children}
    </NavDropdownContext.Provider>
  );
};

// =====================================================================
// Public API types
// =====================================================================

export interface NavDropdownItem {
  label: string;
  href: string;
  /** Resolved by the caller via `isMenuItemActive`. */
  active?: boolean;
}

export interface NavDropdownGroup {
  label: string;
  items: readonly NavDropdownItem[];
}

export interface NavDropdownProps {
  /** Trigger label (e.g. "A-Ploeg", "Jeugd", "De club"). */
  label: string;
  /** Trigger's own destination — clicking the label still navigates here. */
  href: string;
  /**
   * Stable identifier used for cross-panel coordination via the optional
   * `<NavDropdownProvider>`. Auto-generated via `useId()` when omitted —
   * pass an explicit value from stories/tests that need to drive open state
   * deterministically.
   */
  id?: string;
  /** Whether the trigger or any descendant is active. */
  triggerActive?: boolean;
  /** Flat children — narrow 280px panel (Teams, Jeugd). */
  items?: readonly NavDropdownItem[];
  /**
   * Grouped children — wide 560px panel (De club). Takes precedence over
   * `items` when both are passed.
   */
  itemGroups?: readonly NavDropdownGroup[];
  /** Optional callback fired when the user navigates from a panel item. */
  onNavigate?: () => void;
  /** Optional className for the outer `<li>`. */
  className?: string;
}

// =====================================================================
// Component
// =====================================================================

export const NavDropdown = ({
  label,
  href,
  id: providedId,
  triggerActive,
  items,
  itemGroups,
  onNavigate,
  className,
}: NavDropdownProps) => {
  const autoId = useId();
  const id = providedId ?? autoId;
  const ctx = useContext(NavDropdownContext);
  const [localOpenId, setLocalOpenId] = useState<string | null>(null);
  const openId = ctx ? ctx.openId : localOpenId;
  const setOpenId = ctx ? ctx.setOpenId : setLocalOpenId;
  const isOpen = openId === id;

  const triggerRef = useRef<HTMLAnchorElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeImmediately = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    setOpenId((current) => (current === id ? null : current));
  }, [clearOpenTimer, clearCloseTimer, setOpenId, id]);

  const scheduleOpen = useCallback(() => {
    clearCloseTimer();
    if (openId === id) return;
    clearOpenTimer();
    openTimerRef.current = setTimeout(() => {
      setOpenId(id);
    }, OPEN_GRACE_MS);
  }, [openId, id, setOpenId, clearOpenTimer, clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearOpenTimer();
    if (openId !== id) return;
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      // Only close if WE are still the open one (otherwise we've been displaced).
      setOpenId((current) => (current === id ? null : current));
    }, CLOSE_GRACE_MS);
  }, [openId, id, setOpenId, clearOpenTimer, clearCloseTimer]);

  // Cleanup timers on unmount.
  useEffect(
    () => () => {
      clearOpenTimer();
      clearCloseTimer();
    },
    [clearOpenTimer, clearCloseTimer],
  );

  // Pathname change closes the panel. Skip the first run so a panel that was
  // pre-opened (e.g. via `defaultOpenId` in stories/tests, or because state
  // was hydrated to "open") does not immediately close on mount.
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    closeImmediately();
  }, [pathname, closeImmediately]);

  // While open: Escape closes + refocuses; pointerdown outside closes.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeImmediately();
        triggerRef.current?.focus();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      closeImmediately();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, closeImmediately]);

  const focusFirstItem = useCallback(() => {
    requestAnimationFrame(() => {
      const first =
        panelRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
      first?.focus();
    });
  }, []);

  const handleTriggerKeyDown = (e: ReactKeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      clearOpenTimer();
      clearCloseTimer();
      setOpenId(id);
      focusFirstItem();
    }
  };

  const handlePanelKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!panelRef.current) return;
    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    );
    if (focusables.length === 0) return;
    const currentIdx = focusables.findIndex(
      (el) => el === document.activeElement,
    );

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusables[
          currentIdx === -1 ? 0 : (currentIdx + 1) % focusables.length
        ]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        focusables[
          currentIdx === -1
            ? focusables.length - 1
            : (currentIdx - 1 + focusables.length) % focusables.length
        ]?.focus();
        break;
      case "Home":
        e.preventDefault();
        focusables[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        focusables[focusables.length - 1]?.focus();
        break;
      case "Tab": {
        const isLast = currentIdx === focusables.length - 1;
        const isFirst = currentIdx === 0;
        if ((!e.shiftKey && isLast) || (e.shiftKey && isFirst)) {
          // Defer the close so the browser advances focus to the next nav
          // item BEFORE the panel (containing the focused <a>) unmounts.
          // Without this, focus can fall back to <body> when React unmounts
          // mid-Tab-handling.
          setTimeout(() => closeImmediately(), 0);
        }
        break;
      }
    }
  };

  const handleItemClick = () => {
    closeImmediately();
    onNavigate?.();
  };

  const isWide = !!(itemGroups && itemGroups.length > 0);
  const widthClass = isWide ? "w-[560px]" : "w-[280px]";
  // De club's wide panel anchors right (it's the rightmost submenu);
  // Teams + Jeugd's narrow panels anchor left.
  const anchorClass = isWide ? "right-0" : "left-0";

  return (
    <li
      className={cn("relative", className)}
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <Link
        ref={triggerRef}
        href={href}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={cn(
          "font-mono text-[11px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase no-underline transition-colors xl:text-[13px] 2xl:text-[14px]",
          triggerActive || isOpen
            ? "text-jersey-deep"
            : "text-ink hover:text-jersey-deep",
        )}
      >
        {label}
        <span
          aria-hidden="true"
          className={cn(
            "ml-1 inline-block transition-transform duration-150",
            isOpen && "rotate-180",
          )}
        >
          ▾
        </span>
      </Link>

      {isOpen && (
        <div
          ref={panelRef}
          role="menu"
          aria-label={label}
          onKeyDown={handlePanelKeyDown}
          className={cn(
            "bg-ink-soft border-ink absolute top-[calc(100%+1px)] z-[60] border",
            "shadow-[var(--shadow-paper-sm-soft)]",
            "max-w-[calc(100vw-2rem)]",
            "animate-[nav-dropdown-in_150ms_ease-out_both]",
            "motion-reduce:animate-none",
            widthClass,
            anchorClass,
          )}
        >
          {isWide ? (
            <div className="grid grid-cols-2 gap-x-8 px-[22px] py-5">
              {itemGroups!
                .filter((group) => group.items.length > 0)
                .map((group) => (
                  <div key={group.label}>
                    <p className="border-ink-muted text-ink-muted mb-2 border-b border-dashed pb-1.5 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase">
                      {group.label}
                    </p>
                    {/*
                     * `role="none"` removes the intermediate `<ul>` from the
                     * accessibility tree so the surrounding `role="menu"`
                     * directly owns the `role="menuitem"` rows (per WAI-ARIA
                     * menu pattern).
                     */}
                    <ul role="none" className="m-0 list-none p-0">
                      {group.items.map((item) => (
                        <NavDropdownRow
                          key={`${group.label}-${item.href}`}
                          item={item}
                          variant="wide"
                          onClick={handleItemClick}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          ) : (
            // `role="none"` removes this `<ul>` from the a11y tree.
            // p-0 wins over the UA `<ul>` `padding-inline-start: 40px` default;
            // narrow rows manage their own horizontal padding via `variant`.
            <ul role="none" className="m-0 list-none p-0 py-2">
              {items?.map((item) => (
                <NavDropdownRow
                  key={item.href}
                  item={item}
                  variant="narrow"
                  onClick={handleItemClick}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
};

// =====================================================================
// Item row — internal
// =====================================================================

interface NavDropdownRowProps {
  item: NavDropdownItem;
  /**
   * Controls horizontal padding. `narrow` rows live directly inside a
   * panel with no horizontal container padding, so the row carries the
   * 14px-left / 18px-right design padding itself. `wide` rows live inside
   * a `px-[22px]` panel container and only need a hover-pad nudge.
   */
  variant: "narrow" | "wide";
  onClick: () => void;
}

const NavDropdownRow = ({ item, variant, onClick }: NavDropdownRowProps) => (
  // `role="none"` keeps only the inner `<a role="menuitem">` in the a11y
  // tree — without this, screen readers announce a list-item layer between
  // the menu and each menuitem.
  <li role="none">
    <Link
      href={item.href}
      role="menuitem"
      aria-current={item.active ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "group/row flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-[0.06em] uppercase no-underline transition-colors",
        variant === "narrow" ? "py-2.5 pr-[18px] pl-[14px]" : "px-1 py-2",
        item.active ? "text-jersey-bright" : "text-cream-soft hover:text-cream",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "w-3 flex-shrink-0 leading-none",
          item.active
            ? "text-jersey-bright text-[8px]"
            : "text-ink-muted group-hover/row:text-jersey-bright text-[13px]",
        )}
      >
        {item.active ? "▶" : "—"}
      </span>
      <span className="flex-1">{item.label}</span>
    </Link>
  </li>
);
