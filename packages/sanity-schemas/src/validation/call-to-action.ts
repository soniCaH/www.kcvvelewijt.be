const hasText = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().length > 0

/**
 * `article.callToAction` as seen from inside its own object — the shape
 * `ctx.parent` hands each sub-field's validator.
 */
export interface CallToActionValue {
  question?: string
  emphasis?: string
  lead?: string
  buttonLabel?: string
  reference?: {_ref?: string} | null
  href?: string
}

/**
 * Has the editor started filling in the call-to-action at all? An entirely
 * empty object is the default (no band on the article) and must never trip
 * validation — every other check below is gated on this one first. Not
 * exported — every consumer needs one of the three field-level validators
 * below, never this gate on its own.
 */
function isCallToActionStarted(
  cta: CallToActionValue | undefined | null,
): boolean {
  if (!cta) return false
  return (
    hasText(cta.question) ||
    hasText(cta.emphasis) ||
    hasText(cta.lead) ||
    hasText(cta.buttonLabel) ||
    hasText(cta.href) ||
    Boolean(cta.reference?._ref)
  )
}

/**
 * `question` / `lead` / `buttonLabel` share one rule: optional while the
 * object is untouched, required the moment any sibling field is filled in.
 */
export function validateCallToActionRequiredField(
  cta: CallToActionValue | undefined,
  value: unknown,
  message: string,
): true | string {
  if (!isCallToActionStarted(cta)) return true
  return hasText(value) ? true : message
}

/**
 * `emphasis` must be a literal substring of `question` when set. Both sides
 * are trimmed before the comparison — the render side (`<ArticleCtaBand>`)
 * trims both before handing them to `<EditorialHeading>`'s own substring
 * match, so validating against the untrimmed values here could pass a pair
 * that then fails to highlight on the page.
 */
export function validateCallToActionEmphasis(
  cta: CallToActionValue | undefined,
  emphasis: unknown,
): true | string {
  if (!hasText(emphasis)) return true
  const question = (cta?.question ?? '').trim()
  const trimmedEmphasis = typeof emphasis === 'string' ? emphasis.trim() : ''
  return question.includes(trimmedEmphasis)
    ? true
    : 'Het accentwoord moet letterlijk voorkomen in de vraag.'
}

/**
 * Exactly one of `reference` / `href` once the object is started — checked
 * from both fields so Sanity marks whichever one(s) are wrong, not just one.
 */
export function validateCallToActionLink(
  cta: CallToActionValue | undefined,
  field: 'reference' | 'href',
): true | string {
  if (!isCallToActionStarted(cta)) return true
  const hasReference = Boolean(cta?.reference?._ref)
  const hasHref = hasText(cta?.href)
  if (hasReference && hasHref) {
    return 'Kies één link: een interne verwijzing óf een URL — niet beide.'
  }
  if (!hasReference && !hasHref) {
    return field === 'reference'
      ? 'Verplicht zodra je een oproep invult: kies een interne verwijzing of vul hieronder een URL in.'
      : 'Verplicht zodra je een oproep invult: vul een URL in, of kies hierboven een interne verwijzing.'
  }
  return true
}
