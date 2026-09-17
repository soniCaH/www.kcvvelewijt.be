/**
 * Responsibility Utilities
 *
 * Helper functions for linking organigram members with responsibility paths
 */

import type { Contact, ResponsibilityPath } from "@/types/responsibility";
import type { FAQEntry } from "@/lib/seo/jsonld";

/**
 * Check if a contact references the given staff member (through organigramNode members).
 */
function contactHasMember(
  contact: Contact | undefined,
  memberId: string,
): boolean {
  return (
    contact?.contactType === "position" &&
    (contact.members?.some((m) => m.id === memberId) ?? false)
  );
}

/**
 * Finds responsibility paths for which the given member is the primary contact.
 *
 * @param memberId - The staffMember ID to match against organigramNode members
 * @param paths - The list of responsibility paths to search
 * @returns Responsibility paths where the member is a primary contact member
 */
export function findMemberResponsibilities(
  memberId: string,
  paths: ResponsibilityPath[],
): ResponsibilityPath[] {
  return paths.filter((path) =>
    contactHasMember(path.primaryContact, memberId),
  );
}

/**
 * Locate responsibility paths that include the given member as a step contact.
 *
 * @param memberId - The member ID to match against step contacts
 * @param paths - The list of responsibility paths to search
 * @returns An array of responsibility paths where the member appears in any step contact
 */
export function findMemberStepResponsibilities(
  memberId: string,
  paths: ResponsibilityPath[],
): ResponsibilityPath[] {
  return paths.filter((path) =>
    path.steps?.some((step) => contactHasMember(step.contact, memberId)),
  );
}

/**
 * Collect member IDs referenced in responsibility paths (through organigramNode members).
 *
 * @param paths - Responsibility paths to scan for primary and step contacts
 * @returns An array of member IDs referenced as primary or step contacts in `paths`
 */
export function getMembersWithResponsibilities(
  paths: ResponsibilityPath[],
): string[] {
  const memberIds = new Set<string>();

  paths.forEach((path) => {
    if (path.primaryContact?.contactType === "position") {
      path.primaryContact.members?.forEach((m) => memberIds.add(m.id));
    }
    path.steps?.forEach((step) => {
      if (step.contact?.contactType === "position") {
        step.contact.members?.forEach((m) => memberIds.add(m.id));
      }
    });
  });

  return Array.from(memberIds);
}

/**
 * Return the display label for a responsibility category.
 *
 * @param category - The responsibility category identifier
 * @returns An object containing `label` for the given category; falls back to "Algemeen" if the category is not recognized
 */
export function getCategoryInfo(category: ResponsibilityPath["category"]): {
  label: string;
} {
  const categories = {
    medisch: { label: "Medisch" },
    sportief: { label: "Sportief" },
    administratief: { label: "Administratief" },
    gedrag: { label: "Gedrag" },
    algemeen: { label: "Algemeen" },
    commercieel: { label: "Commercieel" },
  };

  return categories[category] || { label: "Algemeen" };
}

/**
 * Build URL to responsibility finder with optional filters
 *
 * @param basePath - Base path (e.g., "/club/organigram")
 * @param options - Optional filters
 * @returns URL string with query parameters
 */
export function buildResponsibilityUrl(
  basePath: string,
  options?: {
    view?: string;
    responsibilityId?: string;
  },
): string {
  const params = new URLSearchParams();

  if (options?.view) {
    params.set("view", options.view);
  }
  if (options?.responsibilityId) {
    params.set("responsibility", options.responsibilityId);
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Flatten responsibility paths into Schema.org FAQ entries for the `/hulp`
 * FAQPage JSON-LD (#2058): each path's `question` paired with its `summary` and
 * step descriptions collapsed into a single plain-text answer paragraph (rich
 * results want plain text, not markup). Paths whose question or answer is empty
 * are dropped so the structured data never ships a blank Q&A.
 *
 * Typed as `FAQEntry` (a plain `{ question, answer }` DTO — a `import type`, so
 * zero runtime coupling to the SEO layer) so the page can pass the result
 * straight to `buildFAQPageJsonLd`, and the contract is compiler-enforced: a
 * future field on `FAQEntry` becomes a type error here, not silent drift.
 */
export function responsibilityPathsToFaqEntries(
  paths: ReadonlyArray<ResponsibilityPath>,
): FAQEntry[] {
  return paths
    .map((path) => ({
      question: path.question.trim(),
      answer: [path.summary, ...path.steps.map((step) => step.description)]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(" "),
    }))
    .filter((entry) => entry.question !== "" && entry.answer !== "");
}
