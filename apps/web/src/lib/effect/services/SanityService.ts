import { Context, Effect, Layer } from "effect";
import { sanityClient } from "../../sanity/client";
import {
  PLAYERS_QUERY,
  PLAYER_BY_PSD_ID_QUERY,
} from "../../sanity/queries/players";
import { TEAMS_QUERY, TEAM_BY_SLUG_QUERY } from "../../sanity/queries/teams";
import {
  ARTICLES_QUERY,
  ARTICLE_BY_SLUG_QUERY,
} from "../../sanity/queries/articles";
import { SPONSORS_QUERY } from "../../sanity/queries/sponsors";
import { EVENTS_QUERY } from "../../sanity/queries/events";
import { RESPONSIBILITY_PATHS_QUERY } from "../../sanity/queries/responsibilityPaths";

// ─── Types ────────────────────────────────────────────────────────────────────
// Simple interfaces — no Effect Schema validation yet.
// Add per content type as pages are cut over from DrupalService.

export interface SanityPlayer {
  _id: string;
  psdId: string;
  firstName: string | null;
  lastName: string | null;
  jerseyNumber: number | null;
  keeper: boolean;
  positionPsd: string | null;
  position: string | null;
  transparentImageUrl: string | null;
  celebrationImageUrl: string | null;
  psdImageUrl: string | null;
  bio: unknown;
  birthDate: string | null;
  nationality: string | null;
  height: number | null;
  weight: number | null;
}

export interface SanityTrainingSession {
  day: string;
  time: string;
  location: string;
  type: string;
}

export interface SanityStaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  photoUrl: string | null;
}

export interface SanityTeam {
  _id: string;
  psdId: string;
  name: string;
  slug: { current: string };
  age: string;
  gender: string;
  footbelId: number | null;
  leagueId: number | null;
  division: string | null;
  divisionFull: string | null;
  tagline: string | null;
  teamImageUrl: string | null;
  trainingSchedule: SanityTrainingSession[];
  players: SanityPlayer[];
  staff: SanityStaffMember[];
  body: unknown;
  contactInfo: unknown;
}

export interface SanityArticle {
  _id: string;
  title: string;
  slug: { current: string };
  publishAt: string | null;
  featured: boolean;
  tags: string[];
  coverImageUrl: string | null;
  body: unknown;
  relatedArticles?: SanityArticle[];
}

export interface SanitySponsor {
  _id: string;
  name: string;
  url: string | null;
  type: string;
  logoUrl: string | null;
}

export interface SanityEvent {
  _id: string;
  title: string;
  dateStart: string;
  dateEnd: string | null;
  externalLink: { url: string; label: string } | null;
  coverImageUrl: string | null;
}

export interface SanityResponsibilityContact {
  role: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  name: string | null;
}

export interface SanityResponsibilityStep {
  description: string;
  link: string | null;
  contact: SanityResponsibilityContact | null;
}

export interface SanityResponsibilityPath {
  id: string;
  role: string[];
  question: string;
  keywords: string[];
  summary: string;
  category: string;
  icon: string | null;
  primaryContact: SanityResponsibilityContact;
  steps: SanityResponsibilityStep[];
  relatedPaths: string[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export interface SanityServiceInterface {
  readonly getPlayers: () => Effect.Effect<SanityPlayer[]>;
  readonly getPlayerByPsdId: (
    psdId: string,
  ) => Effect.Effect<SanityPlayer | null>;
  readonly getTeams: () => Effect.Effect<SanityTeam[]>;
  readonly getTeamBySlug: (slug: string) => Effect.Effect<SanityTeam | null>;
  readonly getArticles: () => Effect.Effect<SanityArticle[]>;
  readonly getArticleBySlug: (
    slug: string,
  ) => Effect.Effect<SanityArticle | null>;
  readonly getSponsors: () => Effect.Effect<SanitySponsor[]>;
  readonly getEvents: () => Effect.Effect<SanityEvent[]>;
  readonly getResponsibilityPaths: () => Effect.Effect<
    SanityResponsibilityPath[]
  >;
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
  getPlayers: () => fetchGroq<SanityPlayer[]>(PLAYERS_QUERY),
  getPlayerByPsdId: (psdId) =>
    fetchGroq<SanityPlayer | null>(PLAYER_BY_PSD_ID_QUERY, { psdId }),
  getTeams: () => fetchGroq<SanityTeam[]>(TEAMS_QUERY),
  getTeamBySlug: (slug) =>
    fetchGroq<SanityTeam | null>(TEAM_BY_SLUG_QUERY, { slug }),
  getArticles: () => fetchGroq<SanityArticle[]>(ARTICLES_QUERY),
  getArticleBySlug: (slug) =>
    fetchGroq<SanityArticle | null>(ARTICLE_BY_SLUG_QUERY, { slug }),
  getSponsors: () => fetchGroq<SanitySponsor[]>(SPONSORS_QUERY),
  getEvents: () => fetchGroq<SanityEvent[]>(EVENTS_QUERY),
  getResponsibilityPaths: () =>
    fetchGroq<SanityResponsibilityPath[]>(RESPONSIBILITY_PATHS_QUERY),
});
