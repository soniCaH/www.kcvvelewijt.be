/**
 * resolveContact — collapse a `Contact` discriminated union into a flat shape
 * for the finder's person-vocab `<ContactCard>` (7o6c · 4).
 *
 * Three cases (the `team-role` / `manual` / `position` contract is preserved):
 *
 * - **manual**: `role` / `email` / `phone` are already inline.
 * - **position**: the first resolved organigramNode member; the role label is
 *   the position title. The "toon in structuur →" cross-link deep-links the hub
 *   (`/hulp?member=<nodeId>#structuur`) — replacing the retired
 *   `/club/organigram?node=` route — and exposes `nodeId` so the finder can open
 *   the `<MemberDetailPanel>` via `useHubMemberPanel()` and fire
 *   `responsibility_organigram_link {node_id}`.
 * - **team-role**: a generic role label + a `/ploegen` link (per-team selection
 *   intentionally dropped — the team page routes the user to their own ploeg).
 */

import type { Contact } from "@/types/responsibility";

export interface ResolvedContact {
  /** Display name — empty string when no member is resolvable. */
  name: string;
  /** Role label (e.g. "Voorzitter", "Trainer van jouw ploeg"). */
  role: string;
  email?: string;
  phone?: string;
  /**
   * Organigram node (position) `_id` — only set for `position` contacts that
   * carry a `nodeId`. Drives the in-page `<MemberDetailPanel>` open and the
   * hashed `responsibility_organigram_link {node_id}` event. Never rendered.
   */
  nodeId?: string;
  /**
   * "toon in structuur →" / team-finder href. Position → the hub deep-link;
   * team-role → `/ploegen`. Unset for manual contacts and members without a node.
   */
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
        ...(contact.nodeId
          ? {
              nodeId: contact.nodeId,
              organigramHref: `/hulp?member=${encodeURIComponent(
                contact.nodeId,
              )}#structuur`,
            }
          : {}),
      };
    }

    case "team-role": {
      const label = contact.teamRole
        ? TEAM_ROLE_LABELS[contact.teamRole]
        : "Contactpersoon van jouw ploeg";
      return { name: label, role: label, organigramHref: "/ploegen" };
    }
  }
}
