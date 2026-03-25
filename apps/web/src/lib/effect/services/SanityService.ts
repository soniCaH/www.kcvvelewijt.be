import { Context, Effect, Layer } from "effect";
import { sanityClient } from "../../sanity/client";
import { TEAMS_LANDING_QUERY } from "../../sanity/queries/teams";
import { SPONSORS_QUERY } from "../../sanity/queries/sponsors";
import {
  EVENTS_QUERY,
  NEXT_FEATURED_EVENT_QUERY,
} from "../../sanity/queries/events";
import { HOMEPAGE_BANNERS_QUERY } from "../../sanity/queries/homePage";
import { RESPONSIBILITY_PATHS_QUERY } from "../../sanity/queries/responsibilityPaths";
import { STAFF_MEMBERS_QUERY } from "../../sanity/queries/staffMembers";
import { PAGE_BY_SLUG_QUERY } from "../../sanity/queries/pages";
import type { TeamLandingItem } from "../../utils/group-teams";
import type { PortableTextBlock } from "@portabletext/react";
import type {
  ResponsibilityPath,
  Contact,
} from "../../../types/responsibility";
import type { OrgChartNode } from "../../../types/organigram";

// ─── Types ────────────────────────────────────────────────────────────────────
// Simple interfaces — no Effect Schema validation yet.
// Add per content type as pages are cut over from DrupalService.

export interface SanitySponsor {
  _id: string;
  name: string;
  url: string | null;
  type: string;
  tier: "hoofdsponsor" | "sponsor" | "sympathisant" | null;
  featured: boolean;
  logoUrl: string | null;
}

export interface SanityEvent {
  _id: string;
  title: string;
  dateStart: string;
  dateEnd: string | null;
  externalLink: { url: string; label: string } | null;
  coverImageUrl: string | null;
  featuredOnHome?: boolean;
}

export interface SanityBannerSlot {
  _id: string;
  imageUrl: string;
  alt: string;
  href: string | null;
}

export interface SanityHomepageBanners {
  bannerSlotA: SanityBannerSlot | null;
  bannerSlotB: SanityBannerSlot | null;
  bannerSlotC: SanityBannerSlot | null;
}

export interface SanityResponsibilityContact {
  role: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  name: string | null;
  memberId: string | null;
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

export interface SanityOrgMember {
  _id: string;
  firstName: string | null;
  lastName: string | null;
  positionTitle: string | null;
  positionShort: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  responsibilities: string | null;
  parentId: string | null; // resolved from parentMember->_id
}

export interface SanityPage {
  _id: string;
  title: string;
  slug: { current: string };
  body: PortableTextBlock[] | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export interface SanityServiceInterface {
  readonly getTeamsLanding: () => Effect.Effect<TeamLandingItem[]>;
  readonly getSponsors: () => Effect.Effect<SanitySponsor[]>;
  readonly getEvents: () => Effect.Effect<SanityEvent[]>;
  readonly getNextFeaturedEvent: () => Effect.Effect<SanityEvent | null>;
  readonly getHomepageBanners: () => Effect.Effect<SanityHomepageBanners>;
  readonly getResponsibilityPaths: () => Effect.Effect<ResponsibilityPath[]>;
  readonly getStaffMembers: () => Effect.Effect<OrgChartNode[]>;
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

/**
 * Converts a SanityResponsibilityContact into the public Contact shape.
 *
 * @param c - The source contact from Sanity; may omit name, email, phone, department, or role
 * @returns A Contact object with `role` defaulting to an empty string when absent and including `name`, `email`, `phone`, and `department` only if present on the source
 */

function mapContact(c: SanityResponsibilityContact): Contact {
  return {
    role: c.role ?? "",
    ...(c.name ? { name: c.name } : {}),
    ...(c.email ? { email: c.email } : {}),
    ...(c.phone ? { phone: c.phone } : {}),
    ...(c.department
      ? { department: c.department as Contact["department"] }
      : {}),
    ...(c.memberId ? { memberId: c.memberId } : {}),
  };
}

/**
 * Convert a SanityResponsibilityPath record into a public ResponsibilityPath.
 *
 * @param p - The raw responsibility path as returned by Sanity
 * @returns A ResponsibilityPath with the same core fields; includes `icon` only if present, maps `primaryContact`, and converts `steps` into ordered steps (order starts at 1) including optional `link` and `contact` when provided
 */
function mapResponsibilityPath(
  p: SanityResponsibilityPath,
): ResponsibilityPath {
  return {
    id: p.id,
    role: p.role as ResponsibilityPath["role"],
    question: p.question,
    keywords: p.keywords,
    summary: p.summary,
    category: p.category as ResponsibilityPath["category"],
    ...(p.icon ? { icon: p.icon } : {}),
    primaryContact: mapContact(p.primaryContact),
    steps: p.steps.map((s, i) => ({
      order: i + 1,
      description: s.description,
      ...(s.link ? { link: s.link } : {}),
      ...(s.contact ? { contact: mapContact(s.contact) } : {}),
    })),
  };
}

const CLUB_ROOT_NODE: OrgChartNode = {
  id: "club",
  name: "KCVV Elewijt",
  title: "Voetbalclub",
  imageUrl: "/images/logo-flat.png",
  department: "algemeen",
  parentId: null,
};

const mapOrgMember = (m: SanityOrgMember): OrgChartNode => ({
  id: m._id,
  name: `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim(),
  title: m.positionTitle ?? "",
  positionShort: m.positionShort ?? undefined,
  imageUrl: m.photoUrl ?? undefined,
  email: m.email ?? undefined,
  phone: m.phone ?? undefined,
  responsibilities: m.responsibilities ?? undefined,
  department: (m.department ?? undefined) as OrgChartNode["department"],
  parentId: m.parentId ?? "club",
});

export const SanityServiceLive = Layer.succeed(SanityService, {
  getTeamsLanding: () => fetchGroq<TeamLandingItem[]>(TEAMS_LANDING_QUERY),
  getSponsors: () => fetchGroq<SanitySponsor[]>(SPONSORS_QUERY),
  getEvents: () => fetchGroq<SanityEvent[]>(EVENTS_QUERY),
  getNextFeaturedEvent: () =>
    fetchGroq<SanityEvent | null>(NEXT_FEATURED_EVENT_QUERY, {
      now: new Date().toISOString(),
    }),
  getHomepageBanners: () =>
    fetchGroq<SanityHomepageBanners | null>(HOMEPAGE_BANNERS_QUERY).pipe(
      Effect.map(
        (data) =>
          data ?? { bannerSlotA: null, bannerSlotB: null, bannerSlotC: null },
      ),
    ),
  getResponsibilityPaths: () =>
    fetchGroq<SanityResponsibilityPath[]>(RESPONSIBILITY_PATHS_QUERY).pipe(
      Effect.map((paths) => paths.map(mapResponsibilityPath)),
    ),
  getStaffMembers: () =>
    fetchGroq<SanityOrgMember[]>(STAFF_MEMBERS_QUERY).pipe(
      Effect.map((members) => [CLUB_ROOT_NODE, ...members.map(mapOrgMember)]),
    ),
  getPage: (slug) => fetchGroq<SanityPage | null>(PAGE_BY_SLUG_QUERY, { slug }),
});
