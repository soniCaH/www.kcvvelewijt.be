import { Context, Effect, Layer } from "effect";
import { sanityClient } from "../../sanity/client";
import { TEAMS_LANDING_QUERY } from "../../sanity/queries/teams";

import type { TeamLandingItem } from "../../utils/group-teams";

// ─── Service ──────────────────────────────────────────────────────────────────

export interface SanityServiceInterface {
  readonly getTeamsLanding: () => Effect.Effect<TeamLandingItem[]>;
}

export class SanityService extends Context.Tag("SanityService")<
  SanityService,
  SanityServiceInterface
>() {}

// ─── Live layer ───────────────────────────────────────────────────────────────

const fetchGroq = <T>(query: string, params?: Record<string, unknown>) =>
  Effect.tryPromise({
    try: () => sanityClient.fetch<T>(query, params ?? {}),
    catch: (cause) => new Error(`Sanity fetch failed: ${String(cause)}`),
  }).pipe(Effect.orDie);

export const SanityServiceLive = Layer.succeed(SanityService, {
  getTeamsLanding: () => fetchGroq<TeamLandingItem[]>(TEAMS_LANDING_QUERY),
});
