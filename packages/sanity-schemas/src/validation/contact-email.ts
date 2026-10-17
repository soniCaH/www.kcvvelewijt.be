/**
 * Email check for the `manual` contact fields (`responsibility` contactFields).
 * Only validates while the field is visible: the field is `hidden` unless
 * `contactType === 'manual'`, and a stale value left under another type must
 * not block publishing where the editor cannot see it (#3478).
 */
// Same shape as Sanity's own `Rule.email()` check.
const EMAIL_PATTERN =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export function validateContactEmail(
  value: unknown,
  parent: {contactType?: string} | undefined,
): true | string {
  if (parent?.contactType !== 'manual') return true
  if (typeof value !== 'string' || value.length === 0) return true
  return EMAIL_PATTERN.test(value) ? true : 'Dit is geen geldig e-mailadres.'
}
