// Types-entry barrel for the design-sync converter (the ".d.ts export surface"
// it expects a real package to ship). Re-exports the declarations tsc emits into
// dist-types/ (gitignored, regenerated via tsconfig.dts.json). ts-morph follows
// these relative re-exports to enumerate the real component export names + prop
// types. Keep in sync with .design-sync/entry.ts (the esbuild bundle entry).
export * from "./dist-types/components/design-system";
export * from "./dist-types/components/layout";
export * from "./dist-types/components/design-system/QASectionDivider";
export * from "./dist-types/components/design-system/SubjectAvatar";
export { CookiePreferencesButton } from "./dist-types/components/layout/SiteFooter/CookiePreferencesButton";
