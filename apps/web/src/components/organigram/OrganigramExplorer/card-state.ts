/** Occupancy of a box: no holder, one, or several. */
export type CardState = "single" | "shared" | "vacant";

/** Occupancy state from the holder count: 0 → vacant, 1 → single, 2+ → shared. */
export function deriveCardState(memberCount: number): CardState {
  if (memberCount <= 0) return "vacant";
  if (memberCount === 1) return "single";
  return "shared";
}
