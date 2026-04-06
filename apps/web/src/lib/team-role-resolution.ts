import type { Contact, ResponsibilityPath } from "@/types/responsibility";

/**
 * Staff member shape from team data (matches TeamRepository view models).
 */
export interface TeamStaffMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email?: string;
  phone?: string;
}

const ROLE_LABELS: Record<string, string> = {
  trainer: "Trainer",
  afgevaardigde: "Afgevaardigde",
};

/**
 * Resolve a team-role contact to a concrete Contact by finding the
 * matching staff member in the team's staff array.
 *
 * Returns null if no staff member has the requested role.
 */
export function resolveTeamRoleContact(
  staff: TeamStaffMember[],
  teamRole: "trainer" | "afgevaardigde",
): Contact | null {
  const match = staff.find((s) => s.role === teamRole);
  if (!match) return null;

  return {
    contactType: "position",
    position: ROLE_LABELS[teamRole] ?? teamRole,
    members: [
      {
        id: match.id,
        name: `${match.firstName} ${match.lastName}`.trim(),
        ...(match.email ? { email: match.email } : {}),
        ...(match.phone ? { phone: match.phone } : {}),
      },
    ],
  };
}

export type JcGroup = "onderbouw" | "middenbouw" | "bovenbouw";

/**
 * Map a team age code (e.g. "U13", "U7A") to the corresponding JC group.
 * Returns null for non-youth ages.
 */
export function mapAgeToJcGroup(age: string | null): JcGroup | null {
  if (!age) return null;
  const match = age.match(/[Uu](\d{1,2})/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (num <= 9) return "onderbouw";
  if (num <= 13) return "middenbouw";
  return "bovenbouw";
}

/**
 * Check whether a responsibility path has any team-role contact
 * (primary or in any step). Used to decide whether to show team selection UI.
 */
export function hasTeamRoleContact(path: ResponsibilityPath): boolean {
  if (path.primaryContact.contactType === "team-role") return true;
  return path.steps.some((s) => s.contact?.contactType === "team-role");
}
