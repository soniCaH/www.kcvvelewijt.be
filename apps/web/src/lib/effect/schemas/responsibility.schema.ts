/**
 * Responsibility Q&A Effect Schema
 *
 * Runtime validation schemas for responsibility paths parsed from markdown.
 * These schemas ensure markdown content is valid and type-safe.
 *
 * @see content/responsibility/*.md - Source markdown files
 * @see scripts/generate-responsibility-data.ts - Build script
 */

import { Schema as S } from "effect";

/**
 * User role schema
 *
 * Defines who can ask a particular question.
 */
export const UserRoleSchema = S.Literal(
  "speler",
  "ouder",
  "trainer",
  "supporter",
  "niet-lid",
);

export type UserRole = S.Schema.Type<typeof UserRoleSchema>;

/**
 * Category schema
 *
 * Categorizes questions by topic area.
 */
export const CategorySchema = S.Literal(
  "medisch",
  "sportief",
  "administratief",
  "gedrag",
  "algemeen",
  "commercieel",
);

export type Category = S.Schema.Type<typeof CategorySchema>;

/**
 * Department schema
 *
 * Organizational departments within the club.
 */
export const DepartmentSchema = S.Literal(
  "hoofdbestuur",
  "jeugdbestuur",
  "algemeen",
);

export type Department = S.Schema.Type<typeof DepartmentSchema>;

/**
 * Contact information schema
 *
 * Contact person details for a responsibility path or specific step.
 *
 * @example
 * ```typescript
 * {
 *   role: "Jeugdsecretaris",
 *   email: "jeugd@kcvvelewijt.be",
 *   department: "jeugdbestuur"
 * }
 * ```
 */
export class ContactSchema extends S.Class<ContactSchema>("ContactSchema")({
  /**
   * Role or title of the contact person (required)
   * @example "Verzekeringverantwoordelijke", "Trainer", "Jeugdsecretaris"
   */
  role: S.String,

  /**
   * Person's name (optional)
   * @example "Jan Janssens"
   */
  name: S.optional(S.String),

  /**
   * Email address (optional)
   * @example "contact@kcvvelewijt.be"
   */
  email: S.optional(S.String),

  /**
   * Phone number (optional)
   * @example "+32 123 45 67 89"
   */
  phone: S.optional(S.String),

  /**
   * Department the contact belongs to (optional)
   */
  department: S.optional(DepartmentSchema),

  /**
   * Link to organigram or profile (optional)
   * @example "/club/organigram"
   */
  orgLink: S.optional(S.String),

  /**
   * Member ID linking to organigram member (optional)
   * @example "youth-coordinator"
   */
  memberId: S.optional(S.String),
}) {}

/**
 * Solution step schema
 *
 * Individual step in the solution path.
 *
 * @example
 * ```typescript
 * {
 *   order: 1,
 *   description: "Meld het ongeval bij je trainer",
 *   contact: {
 *     role: "Trainer",
 *     email: "trainer@kcvvelewijt.be"
 *   }
 * }
 * ```
 */
export class SolutionStepSchema extends S.Class<SolutionStepSchema>(
  "SolutionStepSchema",
)({
  /**
   * Step number (1-indexed, sequential). Optional — use array index when not set.
   */
  order: S.optional(S.Number),

  /**
   * Description of what to do
   * @example "Contacteer de verzekeringverantwoordelijke binnen 48 uur"
   */
  description: S.String,

  /**
   * Optional link to related page or resource
   * @example "/club/downloads"
   */
  link: S.optional(S.String),

  /**
   * Optional contact information specific to this step
   */
  contact: S.optional(ContactSchema),
}) {}

/**
 * Complete responsibility path schema
 *
 * Full Q&A entry with metadata, summary, and solution steps.
 *
 * @example
 * ```typescript
 * {
 *   id: "ongeval-speler-training",
 *   role: ["speler", "ouder"],
 *   question: "heb een ongeval op training/wedstrijd",
 *   keywords: ["ongeval", "blessure", "letsel"],
 *   category: "medisch",
 *   icon: "heart",
 *   primaryContact: {
 *     role: "Verzekeringverantwoordelijke",
 *     email: "verzekering@kcvvelewijt.be",
 *     department: "algemeen"
 *   },
 *   summary: "Meld het ongeval onmiddellijk...",
 *   steps: [...]
 * }
 * ```
 */
export class ResponsibilityPathSchema extends S.Class<ResponsibilityPathSchema>(
  "ResponsibilityPathSchema",
)({
  /**
   * Unique identifier (kebab-case)
   * @example "ongeval-speler-training"
   */
  id: S.String,

  /**
   * User roles that can ask this question
   * Must have at least one role
   */
  role: S.Array(UserRoleSchema).pipe(S.minItems(1)),

  /**
   * Question text as users will search for it
   * Should be lowercase, conversational, no punctuation
   * @example "heb een ongeval op training/wedstrijd"
   */
  question: S.String,

  /**
   * Keywords for search matching
   * Should be generous - include synonyms and related terms
   */
  keywords: S.Array(S.String).pipe(S.minItems(1)),

  /**
   * Short answer summary (1-2 sentences)
   * @example "Meld het ongeval onmiddellijk bij je trainer..."
   */
  summary: S.String,

  /**
   * Category for grouping questions
   */
  category: CategorySchema,

  /**
   * Lucide icon name for visual representation
   * @example "heart", "trophy", "file-text"
   */
  icon: S.optional(S.String),

  /**
   * Primary contact person for this question
   */
  primaryContact: ContactSchema,

  /**
   * Ordered list of solution steps
   * Should have at least one step
   */
  steps: S.Array(SolutionStepSchema).pipe(S.minItems(1)),
}) {}

/**
 * Array of responsibility paths
 *
 * Validated collection of all Q&A entries.
 */
export const ResponsibilityPathsArraySchema = S.Array(
  ResponsibilityPathSchema,
).pipe(S.minItems(1));

export type ResponsibilityPath = S.Schema.Type<typeof ResponsibilityPathSchema>;
export type ResponsibilityPathsArray = S.Schema.Type<
  typeof ResponsibilityPathsArraySchema
>;

/**
 * Export types for compatibility with existing code
 */
export type { ContactSchema as Contact };
export type { SolutionStepSchema as SolutionStep };
