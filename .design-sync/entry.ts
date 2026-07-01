// Design-sync bundle entry — UI + Layout scope only.
// Re-exports the two committed barrels so every discovered component resolves
// to window.<globalName>.<Name>. Extra exports are harmless.
export * from "@/components/design-system";
export * from "@/components/layout";
// Stories exist for these but the design-system barrel doesn't re-export them:
export * from "@/components/design-system/QASectionDivider";
export * from "@/components/design-system/SubjectAvatar";
// Layout story not covered by the layout barrel:
export { CookiePreferencesButton } from "@/components/layout/SiteFooter/CookiePreferencesButton";
