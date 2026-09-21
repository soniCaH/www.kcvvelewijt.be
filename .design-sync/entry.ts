// Design-sync bundle entry — UI + Layout scope only.
// Re-exports the two committed barrels so every discovered component resolves
// to window.<globalName>.<Name>. Extra exports are harmless.
export * from "@/components/design-system";
export * from "@/components/layout";
