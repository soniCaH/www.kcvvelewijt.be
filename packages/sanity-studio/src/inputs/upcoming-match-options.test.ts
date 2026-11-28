import {describe, expect, it} from 'vitest'
import {toMatchOptions} from './upcoming-match-options'

// The BFF's `date` is the Brussels wall clock written as UTC.
const row = {
  id: 3414,
  date: '2026-11-28T15:00:00.000Z',
  time: '15:00',
  kcvv_team_label: 'U21',
  home_team: {id: 1, name: 'KCVV Elewijt'},
  away_team: {id: 2, name: 'Racing Mechelen'},
}

describe('toMatchOptions (#3920)', () => {
  it('makes one line per match: day · time · team · home – away', () => {
    expect(toMatchOptions([row])).toEqual([
      {
        value: '3414',
        line: 'za 28 nov · 15:00 · U21 · KCVV Elewijt – Racing Mechelen',
      },
    ])
  })

  it('reads the date as the Brussels wall clock, not as a UTC instant', () => {
    const lateEvening = {
      ...row,
      date: '2026-11-28T23:30:00.000Z',
      time: '23:30',
    }
    expect(toMatchOptions([lateEvening])[0]?.line).toMatch(/^za 28 nov · 23:30/)
  })

  it('leaves out the team when the match has no team label', () => {
    const {kcvv_team_label: _, ...noLabel} = row
    expect(toMatchOptions([noLabel])[0]?.line).toBe(
      'za 28 nov · 15:00 · KCVV Elewijt – Racing Mechelen',
    )
  })

  it('skips a row it cannot read, and anything that is not a list', () => {
    expect(toMatchOptions([row, {id: 'x'}, null])).toHaveLength(1)
    expect(toMatchOptions({error: 'down'})).toEqual([])
  })
})
