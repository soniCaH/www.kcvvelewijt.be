export { HubSearch } from "./HubSearch";
export type { HubSearchProps, HubSearchVariant } from "./HubSearch";
// Only the provider crosses the folder boundary — `/hulp` mounts it. The
// hook and the inset publisher are consumed in-folder and by the section nav
// via their own module paths.
export { HubSearchQueryProvider } from "./HubSearchQueryProvider";
// `searchHub`, `searchMembers` and `searchResponsibilities` are deliberately
// NOT re-exported here: every consumer (HubSearch.tsx, hub-search.test.ts)
// imports each directly from "./hub-search".
export type {
  HubSearchResult,
  HubMemberResult,
  HubResponsibilityResult,
} from "./hub-search";
