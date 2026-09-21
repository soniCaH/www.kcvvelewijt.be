/**
 * Responsibility Paths Types
 *
 * System to help users find the right contact person for their questions
 */

/**
 * User role type
 */
export type UserRole =
  "speler" | "ouder" | "trainer" | "supporter" | "niet-lid" | "andere";

/**
 * A resolved organigramNode member (`position` contacts only).
 */
export interface ContactMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

/**
 * Contact information for who to reach out to — a discriminated union on
 * `contactType`, one arm per shape `resolveContact.ts` and
 * `responsibility.repository.ts`'s `toContact()` actually construct. Each
 * arm types only the fields that contact type uses, so there is no flat
 * shared shape to accidentally read (or leave dead) a foreign-arm field on
 * — see #2958, which replaced the former single flat interface that let the
 * unreachable `teamRoleFallback` field (#2952) sit untyped-differently
 * from every live field for months.
 */
export type Contact =
  | {
      contactType: "position";
      /** organigramNode title */
      position?: string;
      /** organigramNode roleCode */
      roleCode?: string;
      /** resolved organigramNode members */
      members?: ContactMember[];
      /** organigramNode _id for "Bekijk in organigram" link */
      nodeId?: string;
    }
  | {
      contactType: "team-role";
      /**
       * Picks the generic role label `resolveContact.ts` renders (e.g.
       * "Trainer van jouw ploeg") plus a `/ploegen` link — never resolved to
       * a specific team or member (per-team resolution was dropped in
       * #2100). Required: Sanity's `validateContactFields` `Rule.custom`
       * enforces it on every `team-role` document written through Studio.
       * That check does not cover documents written via the Content API, so
       * `responsibility.repository.ts`'s `toContact()` degrades a
       * `team-role` row that is missing one — or holds a value outside the
       * known set — to a `manual` contact rather than construct a `Contact`
       * value this type says cannot exist.
       */
      teamRole: "trainer" | "afgevaardigde";
    }
  | {
      contactType: "manual";
      /** display role label */
      role?: string;
      /** email address */
      email?: string;
      /** phone number */
      phone?: string;
      /** department */
      department?: "hoofdbestuur" | "jeugdbestuur" | "algemeen";
    };

/**
 * Step in the solution path
 */
export interface SolutionStep {
  /** Order of the step (optional — use array index when not set) */
  order?: number;
  /** Description of what to do */
  description: string;
  /** Optional link to more info */
  link?: string;
  /** Who to contact for this step */
  contact?: Contact;
}

/**
 * Complete responsibility path item
 */
export interface ResponsibilityPath {
  /** Unique identifier */
  id: string;
  /** Editor's short name for the path. Not rendered — it is a search field (#3092). */
  title: string;
  /** User role (who is asking) */
  role: UserRole[];
  /** The question/scenario */
  question: string;
  /** Keywords for search matching */
  keywords: string[];
  /** Short answer/summary */
  summary: string;
  /** Detailed solution steps */
  steps: SolutionStep[];
  /** Primary contact person */
  primaryContact: Contact;
  /** Category for grouping */
  category:
    | "medisch"
    | "sportief"
    | "administratief"
    | "gedrag"
    | "algemeen"
    | "commercieel";
  /** Icon for visual representation */
  icon?: string;
  /** Slugs of related responsibility paths */
  relatedPaths?: string[];
}

/**
 * Audience filters for the `/hulp` hub — the single source of truth shared by
 * the hero deep-link chips (`<OrganigramHero>`) and the finder filter chips
 * (`<HulpFinder>`), so the two can never drift (7o9). Ouder-first (the most
 * common help-seeker); "Nieuw lid" gives non-members a door (they had none).
 *
 * Supersedes the former `ROLE_OPTIONS` picker list (removed in #2058 — it had
 * been dead since the redesign migrated every consumer here). "andere" stays
 * excluded: a valid `UserRole` for data, but never a picker choice.
 */
export const HUB_AUDIENCE_FILTERS: ReadonlyArray<{
  value: UserRole;
  label: string;
}> = [
  { value: "ouder", label: "Ouder" },
  { value: "speler", label: "Speler" },
  { value: "trainer", label: "Trainer" },
  { value: "supporter", label: "Supporter" },
  { value: "niet-lid", label: "Nieuw lid" },
];

/**
 * Autocomplete suggestion
 */
export interface AutocompleteSuggestion {
  /** Path item */
  path: ResponsibilityPath;
  /** Match score (0-100) */
  score: number;
}
