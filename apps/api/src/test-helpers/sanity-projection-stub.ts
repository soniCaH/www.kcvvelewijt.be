import { Effect } from "effect";
import type { SanityProjectionInterface } from "../sanity/projection";

/**
 * A `SanityProjectionInterface` that reads nothing: every list is empty, no
 * team is hidden, no routing override. Tests pass only the reads they care
 * about, so a new method on the interface is a one-file change.
 */
export const makeSanityProjectionStub = (
  overrides: Partial<SanityProjectionInterface> = {},
): SanityProjectionInterface => ({
  getPlayersImageState: () => Effect.succeed(new Map()),
  getStaffImageState: () => Effect.succeed(new Map()),
  getActivePlayerPsdIds: () => Effect.succeed([]),
  getActiveStaffPsdIds: () => Effect.succeed([]),
  getActiveTeamPsdIds: () => Effect.succeed([]),
  getTeamPlayerPsdIds: () => Effect.succeed([]),
  getVisibleTeamPsdIds: () => Effect.succeed([]),
  getProtectedStaffPsdIds: () => Effect.succeed([]),
  getFormRoutingConfig: () => Effect.succeed(null),
  getStaffGaps: () =>
    Effect.succeed({
      emptyRoles: [],
      noPhoto: [],
      coordinators: [],
      missingRoleCodes: [],
    }),
  ...overrides,
});
