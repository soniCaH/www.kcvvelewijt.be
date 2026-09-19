export { HulpFinder } from "./HulpFinder";
export type { HulpFinderProps } from "./HulpFinder";

// `QuestionCard`, `ContactCard`, `resolveContact`, `ACCENT_GLYPH_CLASS`,
// `CATEGORY_META`, `CATEGORY_ORDER` and `groupPathsByCategory` are
// deliberately NOT re-exported here: every consumer imports each directly
// from its own subpath (e.g. "./categoryMeta") — see the `Alert` barrel
// (@/components/design-system/Alert/index.ts) for the same pattern.
export type { QuestionCardProps } from "./QuestionCard";
export type { ContactCardProps } from "./ContactCard";
export type { ResolvedContact } from "./resolveContact";
export type { CategoryAccent, CategoryKey, CategoryMeta } from "./categoryMeta";
