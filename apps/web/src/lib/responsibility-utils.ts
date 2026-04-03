/**
 * Responsibility Utilities
 *
 * Helper functions for linking organigram members with responsibility paths
 */

import type { Contact, ResponsibilityPath } from "@/types/responsibility";

/**
 * Check if a contact references the given staff member (through organigramNode members).
 */
function contactHasMember(
  contact: Contact | undefined,
  memberId: string,
): boolean {
  return contact?.members?.some((m) => m.id === memberId) ?? false;
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
    path.primaryContact?.members?.forEach((m) => memberIds.add(m.id));
    path.steps?.forEach((step) => {
      step.contact?.members?.forEach((m) => memberIds.add(m.id));
    });
  });

  return Array.from(memberIds);
}

/**
 * Return the display label and CSS classes for a responsibility category.
 *
 * @param category - The responsibility category identifier
 * @returns An object containing `label`, `colorClass`, and `bgClass` for the given category; falls back to neutral gray styling if the category is not recognized
 */
export function getCategoryInfo(category: ResponsibilityPath["category"]): {
  label: string;
  colorClass: string;
  bgClass: string;
} {
  const categories = {
    medisch: {
      label: "Medisch",
      colorClass: "text-red-600",
      bgClass: "bg-red-50 border-red-200",
    },
    sportief: {
      label: "Sportief",
      colorClass: "text-green-600",
      bgClass: "bg-green-50 border-green-200",
    },
    administratief: {
      label: "Administratief",
      colorClass: "text-purple-600",
      bgClass: "bg-purple-50 border-purple-200",
    },
    gedrag: {
      label: "Gedrag",
      colorClass: "text-orange-600",
      bgClass: "bg-orange-50 border-orange-200",
    },
    algemeen: {
      label: "Algemeen",
      colorClass: "text-blue-600",
      bgClass: "bg-blue-50 border-blue-200",
    },
    commercieel: {
      label: "Commercieel",
      colorClass: "text-teal-600",
      bgClass: "bg-teal-50 border-teal-200",
    },
  };

  return (
    categories[category] || {
      label: "Algemeen",
      colorClass: "text-gray-600",
      bgClass: "bg-gray-50 border-gray-200",
    }
  );
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
