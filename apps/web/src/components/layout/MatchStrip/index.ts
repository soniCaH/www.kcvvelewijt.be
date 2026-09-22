// `MatchStrip`, `MatchStripView` and `MatchStripSkeleton` are deliberately
// NOT re-exported here: every consumer imports each directly from its own
// subpath (e.g. "@/components/layout/MatchStrip/MatchStripView") — see the
// `Alert` barrel (../../design-system/Alert/index.ts) for the same pattern.
// `MatchStripSlot` stays: every layout that mounts it — (landing) and the
// three detail-route layouts (#3027) — imports it through this barrel path.
export type { MatchStripViewProps } from "./MatchStripView";
export { MatchStripSlot } from "./MatchStripSlot";
