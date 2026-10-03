"use client";

import Link from "next/link";
import { LinkPendingDots } from "@/components/design-system/LinkPendingDots";
import { cn } from "@/lib/utils/cn";
import { handleSamePageAnchorClick } from "@/lib/utils/same-page-anchor";

export interface NavTakeoverItemProps {
  label: string;
  href: string;
  active?: boolean;
  onNavigate?: () => void;
}

const ROW =
  "border-paper-edge flex w-full items-center justify-between border-b py-4 text-left font-display text-display-md italic font-bold transition-colors";

/**
 * One row of the mobile nav takeover. Every row is a leaf link — the nav lost
 * its submenus with #2415, so there is no expandable variant.
 */
export function NavTakeoverItem({
  label,
  href,
  active,
  onNavigate,
}: NavTakeoverItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={(e) => {
        handleSamePageAnchorClick(e, href);
        onNavigate?.();
      }}
      className={cn(
        ROW,
        active ? "text-jersey-deep" : "text-ink hover:text-jersey-deep",
        "no-underline",
      )}
    >
      <span>{label}</span>
      <LinkPendingDots spaced={false} />
    </Link>
  );
}
