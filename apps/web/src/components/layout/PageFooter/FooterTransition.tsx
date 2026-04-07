"use client";

import { usePathname } from "next/navigation";
import { SectionTransition } from "@/components/design-system/SectionTransition/SectionTransition";
import type { SectionBg } from "@/components/design-system/SectionTransition/SectionTransition";

/**
 * Diagonal transition into the footer.
 *
 * The footer's first zone is `kcvv-green-dark`, so the transition's TO color
 * is fixed. The FROM color, however, must match the last `SectionStack`
 * section of the current page — otherwise the upper triangle of the diagonal
 * paints the wrong color over the previous section, producing visible seam
 * artifacts (e.g. a gray wedge cutting into a green CTA).
 *
 * Most pages end on `gray-100`, which is the default. Pages whose last
 * section uses a different background register their pathname (or a regex)
 * here so the transition picks up the matching color.
 */
const STATIC_FROM: Partial<Record<string, SectionBg>> = {
  "/sponsors": "kcvv-black",
  "/club/geschiedenis": "kcvv-black",
  "/club/organigram": "kcvv-green-dark",
  "/club/bestuur": "kcvv-green-dark",
  "/club/angels": "kcvv-green-dark",
  "/club/jeugdbestuur": "kcvv-green-dark",
};

const DYNAMIC_FROM: ReadonlyArray<{ pattern: RegExp; from: SectionBg }> = [
  // Team detail pages end on the green CTA section.
  { pattern: /^\/ploegen\/[^/]+$/, from: "kcvv-green-dark" },
];

function resolveFrom(pathname: string): SectionBg {
  const staticMatch = STATIC_FROM[pathname];
  if (staticMatch) return staticMatch;
  const dynamicMatch = DYNAMIC_FROM.find((entry) =>
    entry.pattern.test(pathname),
  );
  return dynamicMatch?.from ?? "gray-100";
}

export function FooterTransition() {
  const pathname = usePathname();
  const from = resolveFrom(pathname);

  return (
    <SectionTransition
      from={from}
      to="kcvv-green-dark"
      type="diagonal"
      direction="left"
    />
  );
}
