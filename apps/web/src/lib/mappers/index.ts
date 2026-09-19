/**
 * Mappers
 * Transform data between different layers (domain ↔ presentation)
 */

// `mapMatchToUpcomingMatch` (singular) is deliberately NOT re-exported here:
// its only consumers (match.mapper.ts itself, match.mapper.test.ts) import
// it directly from "./match.mapper" — see the `Alert` barrel
// (@/components/design-system/Alert/index.ts) for the same pattern.
export { mapMatchesToUpcomingMatches } from "./match.mapper";
