export { UpcomingMatches } from "./UpcomingMatches";
export type { UpcomingMatchesProps } from "./UpcomingMatches";
// `UpcomingMatchesClient` is deliberately NOT re-exported here: its
// consumers (UpcomingMatches.tsx, reservation-never-links.test.tsx) both
// import it directly from "./UpcomingMatchesClient".
export type { UpcomingMatchesClientProps } from "./UpcomingMatchesClient";
