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
 * Two rules, both hard errors (the brief calls both "refused", not
 * "discouraged" — no `Rule.warning()` chain applies here, see #2929 for
 * when one would):
 *
 * 1. A reference and an external name together are refused — pick one.
 * 2. An external speaker (any of `externalRole` / `externalSource` filled
 *    in) needs a name.
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

export interface PullQuoteExternalNameContext {
  parent?: {externalRole?: string; externalSource?: string}
}

export function validatePullQuoteExternalName(
  value: unknown,
  context: PullQuoteExternalNameContext,
): true | string {
  const name = typeof value === 'string' ? value.trim() : ''
  if (name) return true
  const role = context.parent?.externalRole?.trim()
  const source = context.parent?.externalSource?.trim()
  if (role || source) {
    return 'Vul een naam in voor de externe spreker — een rol of bron alleen is niet genoeg.'
  }
  return true
}
