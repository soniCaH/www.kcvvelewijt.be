const hasContent = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().length > 0

/**
 * Validates a `responsibility` contact object (`primaryContact` or a
 * `solutionStep.contact`) against its `contactType` discriminator:
 *
 * - `position`   → requires `organigramNode`.
 * - `team-role`  → requires `teamRole`.
 * - `manual`     → requires at least one of `role` / `email` / `phone` /
 *                  `department`.
 *
 * `required` toggles whether a missing `contactType` is an error:
 * `primaryContact` is mandatory on the parent document, while a per-step
 * contact is optional and short-circuits to `true` when no type was picked.
 * An unrecognised `contactType` returns the "Ongeldig type contact" error.
 *
 * Extracted from the inline validators on `responsibility.primaryContact`
 * and `solutionStep.contact` so it can be unit-tested against synthetic
 * objects without the Sanity Studio runtime.
 */
export function validateContactFields(
  contact: Record<string, unknown> | undefined,
  required: boolean,
): true | string {
  if (!contact?.contactType) return required ? 'Kies een type contact' : true
  switch (contact.contactType) {
    case 'position':
      return contact.organigramNode ? true : 'Kies een organigram-positie'
    case 'team-role':
      return contact.teamRole ? true : 'Kies een teamrol'
    case 'manual':
      return hasContent(contact.email) ||
        hasContent(contact.phone) ||
        hasContent(contact.role) ||
        hasContent(contact.department)
        ? true
        : 'Vul minstens één van: rol, email, telefoon, afdeling in'
    default:
      return 'Ongeldig type contact'
  }
}
