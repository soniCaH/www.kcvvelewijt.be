"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface NavTakeoverItemProps {
  label: string;
  /**
   * Omit when the item is a submenu trigger with no leaf navigation.
   */
  href?: string;
  hasSubmenu?: boolean;
  active?: boolean;
  onNavigate?: () => void;
  defaultExpanded?: boolean;
  /**
   * Submenu items rendered collapsed-by-default. Lazy: not rendered until
   * the parent is expanded.
   */
  children?: ReactNode;
}

// Internal context — flipped to `true` for items rendered inside an expanded
// submenu so they pick up the subordinate (mono caps small) row style.
const SubmenuContext = createContext(false);

const PARENT_ROW =
  "border-paper-edge flex w-full items-center justify-between border-b py-4 text-left font-display text-[22px] italic font-bold leading-tight transition-colors";

const CHILD_ROW =
  "group/child relative flex w-full items-center py-2 pl-6 text-left font-mono text-[11px] font-semibold tracking-[0.08em] uppercase leading-none transition-all duration-200";

export function NavTakeoverItem({
  label,
  href,
  hasSubmenu,
  active,
  onNavigate,
  defaultExpanded = false,
  children,
}: NavTakeoverItemProps) {
  const isChild = useContext(SubmenuContext);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const baseRow = isChild ? CHILD_ROW : PARENT_ROW;
  const tone = active
    ? "text-jersey-deep"
    : isChild
      ? "text-ink/70 hover:text-jersey-deep"
      : "text-ink hover:text-jersey-deep";

  if (hasSubmenu) {
    return (
      <div>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          className={cn(baseRow, tone)}
        >
          <span>{label}</span>
          <span
            aria-hidden="true"
            className={cn(
              "font-mono text-sm transition-transform duration-200",
              expanded && "rotate-180",
            )}
          >
            ▾
          </span>
        </button>
        {expanded && children ? (
          <SubmenuContext.Provider value={true}>
            <div
              role="group"
              aria-label={`${label} submenu`}
              className="border-ink/40 my-1 border-l-2 py-1 pl-2"
            >
              {children}
            </div>
          </SubmenuContext.Provider>
        ) : null}
      </div>
    );
  }

  // Render content for both leaf-button and leaf-link.
  const innerContent = isChild ? (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "text-ink/30 group-hover/child:text-jersey-deep absolute left-1 font-mono text-base leading-none transition-colors",
          active && "text-jersey-deep",
        )}
      >
        —
      </span>
      <span className="flex-1">{label}</span>
      <span
        aria-hidden="true"
        className="text-jersey-deep -translate-x-1 pr-2 opacity-0 transition-all duration-200 group-hover/child:translate-x-0 group-hover/child:opacity-100"
      >
        →
      </span>
    </>
  ) : (
    <span>{label}</span>
  );

  if (!href) {
    return <div className={cn(baseRow, tone)}>{innerContent}</div>;
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(baseRow, tone, "no-underline")}
    >
      {innerContent}
    </Link>
  );
}
