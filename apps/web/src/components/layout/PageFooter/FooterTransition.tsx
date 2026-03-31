"use client";

import { usePathname } from "next/navigation";
import { SectionTransition } from "@/components/design-system/SectionTransition/SectionTransition";
import type { SectionBg } from "@/components/design-system/SectionTransition/SectionTransition";

/**
 * Diagonal transition into the footer.
 * Most pages end on gray-100; pages that end on a dark section (e.g. /sponsors)
 * set `from` accordingly so the SVG fill matches and no seam line appears.
 */
const PAGE_FOOTER_FROM: Partial<Record<string, SectionBg>> = {
  "/sponsors": "kcvv-black",
};

export function FooterTransition() {
  const pathname = usePathname();
  const from: SectionBg = PAGE_FOOTER_FROM[pathname] ?? "gray-100";

  return (
    <SectionTransition
      from={from}
      to="kcvv-green-dark"
      type="diagonal"
      direction="left"
    />
  );
}
