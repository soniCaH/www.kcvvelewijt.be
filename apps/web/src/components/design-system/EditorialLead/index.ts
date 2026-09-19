// `truncateLead` is deliberately NOT re-exported here: its only consumer is
// EditorialLead.test.tsx, which imports it directly from "./EditorialLead"
// — see the `Alert` barrel (../Alert/index.ts) for the same pattern.
export { EditorialLead, type EditorialLeadProps } from "./EditorialLead";
