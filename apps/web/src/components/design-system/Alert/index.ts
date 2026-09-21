// `Alert` (the long-form ticket-stub) has zero production consumers since
// SearchInterface.tsx moved onto <EmptyState> (#2580), but it has a story
// (Alert.stories.tsx) and is client-safe ("use client", no server-only
// work) — under #3025's ruling ("a component with a story belongs in its
// barrel") that's the whole test, so it is re-exported below. This barrel
// previously left it out on a bundle-size argument ("forces it into the
// shared webpack chunk on every route" — no "sideEffects: false", no
// optimizePackageImports); that argument died with #2935/#2956
// (2026-09-14), which declared `"sideEffects": ["**/*.css"]` on apps/web's
// package.json, making everything but CSS tree-shakeable regardless of
// barrel membership. See knip.jsonc decision #1 for the full rule.
export { Alert } from "./Alert";
export type { AlertProps, AlertVariant } from "./Alert";
export { AlertBadge } from "./AlertBadge";
export type {
  AlertBadgeProps,
  AlertBadgeVariant,
  AlertBadgeSize,
} from "./AlertBadge";
