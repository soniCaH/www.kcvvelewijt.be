export type MatchOption = {value: string; line: string}

// The BFF's `date` is the Brussels wall clock written as UTC (`kickoffMs` in
// apps/api), so it is formatted in UTC to show the Brussels day.
const DAY = new Intl.DateTimeFormat('nl-BE', {
  timeZone: 'UTC',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const TIME = new Intl.DateTimeFormat('nl-BE', {
  timeZone: 'UTC',
  hour: '2-digit',
  minute: '2-digit',
})

const nameOf = (side: unknown): string | undefined => {
  const name = (side as {name?: unknown} | null)?.name
  return typeof name === 'string' ? name : undefined
}

const toOption = (raw: unknown): MatchOption[] => {
  const m = (raw ?? {}) as Record<string, unknown>
  const date = typeof m.date === 'string' ? new Date(m.date) : undefined
  const home = nameOf(m.home_team)
  const away = nameOf(m.away_team)
  if (typeof m.id !== 'number' || !date || isNaN(date.getTime()) || !home || !away) return []
  const time = typeof m.time === 'string' && m.time !== '' ? m.time : TIME.format(date)
  const team = typeof m.kcvv_team_label === 'string' ? [m.kcvv_team_label] : []
  const line = [DAY.format(date), time, ...team, `${home} – ${away}`].join(' · ')
  return [{value: String(m.id), line}]
}

/**
 * The web's `/api/matches/upcoming` body → one picker option per match (#3920):
 * "za 30 nov · 15:00 · U21 · KCVV Elewijt – Racing Mechelen". It comes over the
 * network, so a row it cannot read is skipped, and a body that is not a list
 * gives no options.
 */
export const toMatchOptions = (raw: unknown): MatchOption[] =>
  Array.isArray(raw) ? raw.flatMap(toOption) : []
