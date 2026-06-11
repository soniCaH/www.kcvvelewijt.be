import type { OrgChartNode } from "@/types/organigram";
import { cn } from "@/lib/utils/cn";
import { deriveCardState } from "@/components/organigram/OrgPersonCard";

/**
 * A single node card inside the spotlight stage (7o3). Unlike the directory's
 * person-forward `<OrgPersonCard>`, the explorer is **position-forward** — you
 * navigate the reporting structure — so the card leads with the position title
 * and shows the holder(s) as the sub-label. Occupancy state (single / shared /
 * vacant) is derived from `members.length` and shares the directory's vocabulary
 * (vacant = warm). Two scales: `center` (the spotlight focus) and `node`
 * (parent / children / explorer leaves).
 */

export type SpotlightNodeVariant = "center" | "node";

export interface SpotlightNodeCardProps {
  node: OrgChartNode;
  variant?: SpotlightNodeVariant;
  /**
   * The synthetic club root — the organisation, not a position. Renders neutral
   * (a "de club" sub-label, never the vacant chrome its 0 members would imply).
   */
  isRoot?: boolean;
  className?: string;
}

/** The sub-label under the position title: holder name · "N personen" · "vacant". */
export function holderLabel(node: OrgChartNode): string {
  const state = deriveCardState(node.members.length);
  if (state === "vacant") return "vacature";
  if (state === "shared") return `${node.members.length} personen`;
  return node.members[0]?.name?.trim() || "—";
}

/**
 * Every spotlight card has the SAME footprint and type scale (a uniform 144×64
 * box, 2-line-clamped title) so a 1-line and a 2-line title never differ in
 * size. The centre is distinguished only by its warm offset shadow, never by a
 * larger box or font — which also keeps the FLIP travel a pure translate (no
 * scale distortion) since source and destination cards are identical in size.
 */
export function SpotlightNodeCard({
  node,
  variant = "node",
  isRoot = false,
  className,
}: SpotlightNodeCardProps) {
  const state = isRoot ? "root" : deriveCardState(node.members.length);
  const isCenter = variant === "center";
  const sublabel = isRoot ? "de club" : holderLabel(node);

  return (
    <span
      data-testid="spotlight-node-card"
      data-state={state}
      data-variant={variant}
      className={cn(
        "border-ink flex h-16 w-36 flex-col items-center justify-center border-2 px-2.5 text-center",
        state === "vacant" ? "bg-warm" : "bg-cream",
        isCenter
          ? "shadow-[4px_4px_0_0_var(--color-warm)]"
          : "shadow-[2px_2px_0_0_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      <span className="font-display text-ink line-clamp-2 text-xs leading-[1.15] font-semibold">
        {node.title}
      </span>
      <span className="text-ink-muted mt-1 block font-mono text-[8px] tracking-[0.06em] uppercase">
        {sublabel}
      </span>
    </span>
  );
}
