// `Alert` (the long-form ticket-stub) is deliberately NOT re-exported here.
// It has zero production consumers since SearchInterface.tsx moved onto
// <EmptyState> (#2580). Originally documented here as a bundle-size fix
// ("forces it into the shared webpack chunk on every route" — no
// "sideEffects: false", no optimizePackageImports): that specific cost no
// longer applies as of #2935/#2956 (2026-09-14), which declared
// `"sideEffects": ["**/*.css"]` on apps/web's package.json, making
// everything but CSS tree-shakeable. The re-export still isn't restored —
// a barrel entry with no reader is dead weight for the next person reading
// this file regardless of bundle cost — but #2934 filed a follow-up
// (#3025) for the design-system owner to re-decide the wider
// barrel policy now that the original bundle-cost evidence is gone. Its
// stories/tests import "./Alert" directly, which is what keeps the file
// itself alive — see Alert.tsx's own docblock.
export { AlertBadge } from "./AlertBadge";
export type {
  AlertBadgeProps,
  AlertBadgeVariant,
  AlertBadgeSize,
} from "./AlertBadge";
