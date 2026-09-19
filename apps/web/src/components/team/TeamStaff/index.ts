// `resolveFunctionLabel` is deliberately NOT re-exported here: its only
// consumer (TeamStaff.test.tsx) imports it directly from "./TeamStaff".
export { TeamStaff } from "./TeamStaff";
export type { TeamStaffProps, TeamStaffMemberData } from "./TeamStaff";
