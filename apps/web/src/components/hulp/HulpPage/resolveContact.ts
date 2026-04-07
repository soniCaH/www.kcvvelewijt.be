/**
 * resolveContact — collapse a `Contact` discriminated union into a flat
 * shape suitable for the new `<ContactCard>`.
 *
 * The legacy ResponsibilityFinder rendered different UI per contact type
 * (manual / position / team-role) including a per-team selector for the
 * team-role case. The redesigned Hulp page shows a single contact card
 * per answer, so we collapse all three cases here:
 *
 * - **manual**: trivial — `role` / `email` / `phone` are already inline.
 * - **position**: take the first resolved organigramNode member; the
 *   role label becomes the position title (e.g. "Voorzitter").
 * - **team-role**: the new design intentionally drops per-team selection.
 *   We render a generic role label ("Trainer van jouw ploeg") and direct
 *   the user to the teams page via `organigramHref`. No member is shown.
 */

import type { Contact } from "@/types/responsibility";

export interface ResolvedContact {
  /** Display name — empty string when no member is resolvable */
  name: string;
  /** Role label (e.g. "Voorzitter", "Trainer van jouw ploeg") */
  role: string;
  email?: string;
  phone?: string;
  /**
   * Internal organigram member ID (Sanity document _id) — only set for
   * `position` contacts. Used by analytics for hashing, never rendered.
   */
  memberId?: string;
  /** Link to "view in organigram" / "find your team" — set for position + team-role */
  organigramHref?: string;
}

const TEAM_ROLE_LABELS: Record<NonNullable<Contact["teamRole"]>, string> = {
  trainer: "Trainer van jouw ploeg",
  afgevaardigde: "Afgevaardigde van jouw ploeg",
};

export function resolveContact(contact: Contact): ResolvedContact {
  switch (contact.contactType) {
    case "manual":
      return {
        name: contact.role ?? "",
        role: contact.role ?? "",
        email: contact.email,
        phone: contact.phone,
      };

    case "position": {
      const member = contact.members?.[0];
      const role = contact.position ?? "";
      return {
        name: member?.name ?? role,
        role,
        email: member?.email,
        phone: member?.phone,
        memberId: member?.id,
        organigramHref: contact.nodeId
          ? `/club/organigram?node=${encodeURIComponent(contact.nodeId)}`
          : "/club/organigram",
      };
    }

    case "team-role": {
      const label = contact.teamRole
        ? TEAM_ROLE_LABELS[contact.teamRole]
        : "Contactpersoon van jouw ploeg";
      return {
        name: label,
        role: label,
        organigramHref: "/ploegen",
      };
    }
  }
}
