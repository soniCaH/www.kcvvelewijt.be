export { QaBlock } from "./QaBlock";
export type { QaBlockValue, QaBlockProps, QaPairValue } from "./QaBlock";
// `QaGroupRapidFire` is deliberately NOT re-exported here: every consumer
// (QaBlock.tsx, its stories, its test) imports it directly from
// "./QaGroupRapidFire".
export type { QaGroupRapidFireProps } from "./QaGroupRapidFire";
