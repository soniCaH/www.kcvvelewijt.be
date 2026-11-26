"use client";

import { useRef, type ReactNode } from "react";
import { useDelegatedClick } from "@/hooks/useDelegatedClick";
import { useNavigationAnalytics } from "@/hooks/useNavigationAnalytics";

export interface FooterAnalyticsProps {
  children: ReactNode;
  /** Applied to the delegating element, which *is* the directory grid. */
  className?: string;
}

/**
 * Client analytics shell for the footer directory (#2419). One native listener
 * reads the inert `data-footer-column` marker off the server-rendered
 * `<SiteFooter>` links below, so the footer itself stays a Server Component and
 * no link grows an `onClick`. The destination comes off the anchor's own
 * `href` — a new footer link never repeats its route in a second attribute.
 *
 * It renders the grid `<div>` rather than wrapping one, so the delegation costs
 * zero extra DOM nodes.
 */
export const FooterAnalytics = ({
  children,
  className,
}: FooterAnalyticsProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { trackFooterClick } = useNavigationAnalytics();

  useDelegatedClick(ref, {
    selector: "[data-footer-column]",
    onMatch: (el) => {
      const destination = el.getAttribute("href");
      const column = el.getAttribute("data-footer-column");
      if (!destination || !column) return;
      trackFooterClick({ destination, column });
    },
  });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};
