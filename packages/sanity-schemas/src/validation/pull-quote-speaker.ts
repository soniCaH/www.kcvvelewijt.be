/**
 * Validates `pullQuote`'s speaker fields (#2517). A quote's speaker is one
 * of three shapes:
 *
 * - a `speaker` reference to a `player` or `staffMember` document — name,
 *   photo and role are resolved from that document at render time;
 * - an external speaker: `externalName` (required in this branch),
 *   optional `externalRole` / `externalSource`;
 * - neither — a nameless quote, which `<PullQuote>` already renders with
 *   no attribution row (#2515 rule 1).
 *
 * Three rules, all hard errors (the brief calls them "refused", not
 * "discouraged" — no `Rule.warning()` chain applies here, see #2929 for
 * when one would):
 *
 * 1. A reference and an external name together are refused — pick one.
 * 2. A reference speaker doesn't take a role/source of its own (those come
 *    from the referenced document) — `externalRole`/`externalSource` filled
 *    in alongside a `speaker` reference are refused on the field they're
 *    actually wrong on, not laundered through "you need a name" (see below).
 * 3. An external speaker (role/source filled in, no reference) needs a name.
 *
 * Rule 3 explicitly steps aside when a reference is set (rule 2 owns that
 * case instead) — without that, an editor who picks a reference speaker
 * while a stale role/source is still filled in gets pulled two directions
 * at once: "fill in a name" on `externalName` fights "not both" on
 * `speaker` the moment they try to satisfy it, and neither message says to
 * just clear the leftover fields (#2517 review).
 *
 * Extracted from the inline Studio validators so they can be unit-tested
 * against synthetic contexts without the Sanity Studio runtime — mirrors
 * `validateRespondentKey` (`respondent-key.ts`).
 */

export interface PullQuoteSpeakerReferenceContext {
  parent?: {externalName?: string}
}

export function validatePullQuoteSpeakerReference(
  value: unknown,
  context: PullQuoteSpeakerReferenceContext,
): true | string {
  const hasReference = value !== undefined && value !== null
  const externalName = context.parent?.externalName?.trim()
  if (hasReference && externalName) {
    return 'Kies één spreker: een verwijzing naar een spelers- of stafprofiel óf een externe naam — niet beide.'
  }
  return true
}

function hasSpeakerReference(speaker: unknown): boolean {
  return speaker !== undefined && speaker !== null
}

export interface PullQuoteExternalRoleSourceContext {
  parent?: {speaker?: unknown}
}

/** Shared by `externalRole` and `externalSource` — rule 2 above. */
export function validatePullQuoteExternalRoleOrSource(
  value: unknown,
  context: PullQuoteExternalRoleSourceContext,
): true | string {
  const filled = typeof value === 'string' && value.trim().length > 0
  if (filled && hasSpeakerReference(context.parent?.speaker)) {
    return 'Rol en bron horen alleen bij een externe spreker — maak ze leeg.'
  }
  return true
}

export interface PullQuoteExternalNameContext {
  parent?: {externalRole?: string; externalSource?: string; speaker?: unknown}
}

export function validatePullQuoteExternalName(
  value: unknown,
  context: PullQuoteExternalNameContext,
): true | string {
  // A reference speaker already covers this quote — a role/source filled in
  // alongside it is flagged on those fields instead (rule 2, above), so this
  // validator stays silent rather than also demanding a name (rule 3's job
  // is only the no-reference case).
  if (hasSpeakerReference(context.parent?.speaker)) return true
  const name = typeof value === 'string' ? value.trim() : ''
  if (name) return true
  const role = context.parent?.externalRole?.trim()
  const source = context.parent?.externalSource?.trim()
  if (role || source) {
    return 'Vul een naam in voor de externe spreker — een rol of bron alleen is niet genoeg.'
  }
  return true
}
