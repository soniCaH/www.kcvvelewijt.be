// `OrganigramExplorer`, `SpotlightNodeCard` and `VolledigOrganigram` all
// have stories and are client-safe, so #3025's "a component with a story
// belongs in its barrel" rule re-adds them here (previously trimmed as
// unconsumed by #2934/#3024). Each is tagged `@public` — knip has no
// consumer to trace for these re-exports and would otherwise flag them as
// dead; the tag says the export is intentional API surface, not an
// oversight. `announceFocus`, `holderLabel`, `buildSpotlightTree`,
// `getSpotlightView`, `primaryFocusId`, `splitFan`, `targetForKey` and
// `CLUB_ROOT_ID` are utility functions/constants, not components — no
// story applies, so they stay deliberately NOT re-exported: every
// consumer imports each directly from its own subpath (e.g.
// "./spotlight-tree") — see the `Alert` barrel
// (@/components/design-system/Alert/index.ts) for the same pattern.
// `OrganigramOverview` stays untagged: apps/web/src/app/(main)/hulp/page.tsx
// imports it through this barrel path, a real consumer knip already sees.

/** @public */
export { OrganigramExplorer } from "./OrganigramExplorer";
export type { OrganigramExplorerProps } from "./OrganigramExplorer";
export { OrganigramOverview } from "./OrganigramOverview";
export type { OrganigramOverviewProps } from "./OrganigramOverview";
/** @public */
export { SpotlightNodeCard } from "./SpotlightNodeCard";
export type {
  SpotlightNodeCardProps,
  SpotlightNodeVariant,
} from "./SpotlightNodeCard";
/** @public */
export { VolledigOrganigram } from "./VolledigOrganigram";
export type { VolledigOrganigramProps } from "./VolledigOrganigram";
export type {
  SpotlightTree,
  SpotlightView,
  SpotlightNavKey,
} from "./spotlight-tree";
