/**
 * Validates `event.dateEnd`: it may not fall before `dateStart`, otherwise the
 * agenda query drops the event at once (#3478). Compared as instants, never as
 * strings: production mixes `+01:00` and `Z` offsets. Skipped when either side
 * is empty or does not parse.
 */
export interface EventDateEndContext {
  parent?: {dateStart?: string}
}

export function validateEventDateEnd(
  dateEnd: string | undefined,
  context: EventDateEndContext,
): true | string {
  const dateStart = context.parent?.dateStart
  if (!dateEnd || !dateStart) return true
  const end = new Date(dateEnd).getTime()
  const start = new Date(dateStart).getTime()
  if (Number.isNaN(end) || Number.isNaN(start)) return true
  return end >= start ? true : 'De einddatum moet op of na de startdatum vallen.'
}
