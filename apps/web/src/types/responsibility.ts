/**
 * Responsibility Paths Types
 *
 * System to help users find the right contact person for their questions
 */

/**
 * User role type
 */
export type UserRole =
  | "speler"
  | "ouder"
  | "trainer"
  | "supporter"
  | "niet-lid"
  | "andere";

/**
 * Contact information for who to reach out to.
 * Discriminated by contactType: position (organigramNode), team-role (dynamic), manual (fallback).
 */
export interface Contact {
  contactType: "position" | "team-role" | "manual";
  /** position: organigramNode title */
  position?: string;
  /** position: organigramNode roleCode */
  roleCode?: string;
  /** position: resolved organigramNode members */
  members?: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
  }>;
  /** position: organigramNode _id for "Bekijk in organigram" link */
  nodeId?: string;
  /** team-role: dynamic role resolved at runtime by #1220 */
  teamRole?: "trainer" | "afgevaardigde";
  /** manual: display role label */
  role?: string;
  /** manual: email address */
  email?: string;
  /** manual: phone number */
  phone?: string;
  /** manual: department */
  department?: "hoofdbestuur" | "jeugdbestuur" | "algemeen";
}

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
 * Role options for the UI role selector.
 * "andere" is intentionally excluded — it is a valid UserRole for data but not shown as a picker choice.
 */
export const ROLE_OPTIONS: ReadonlyArray<{ value: UserRole; label: string }> = [
  { value: "speler", label: "Speler" },
  { value: "ouder", label: "Ouder" },
  { value: "trainer", label: "Trainer" },
  { value: "supporter", label: "Supporter" },
  { value: "niet-lid", label: "Niet-lid" },
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
