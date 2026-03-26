import { Context, Effect, Layer } from "effect";
import { sanityClient } from "../../sanity/client";
import { TEAMS_LANDING_QUERY } from "../../sanity/queries/teams";

import { PAGE_BY_SLUG_QUERY } from "../../sanity/queries/pages";
import type { TeamLandingItem } from "../../utils/group-teams";
import type { PortableTextBlock } from "@portabletext/react";

// ─── Types ────────────────────────────────────────────────────────────────────
// Simple interfaces — no Effect Schema validation yet.
// Add per content type as pages are cut over from DrupalService.

export interface SanityPage {
  _id: string;
  title: string;
  slug: { current: string };
  body: PortableTextBlock[] | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export interface SanityServiceInterface {
  readonly getTeamsLanding: () => Effect.Effect<TeamLandingItem[]>;

  readonly getPage: (slug: string) => Effect.Effect<SanityPage | null>;
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

  getPage: (slug) => fetchGroq<SanityPage | null>(PAGE_BY_SLUG_QUERY, { slug }),
});
