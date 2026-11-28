import {render, screen, waitFor} from '@testing-library/react'
import type {ComponentProps, ReactNode} from 'react'
import type {StringInputProps} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

type AutocompleteShape = {
  options?: Array<{value: string; line: string}>
  onSelect?: (value: string) => void
  disabled?: boolean
}

const autocomplete = vi.fn<(props: AutocompleteShape) => void>()

vi.mock('sanity', () => ({
  PatchEvent: {from: (patch: unknown) => ({patches: [patch]})},
  set: (value: unknown) => ({type: 'set', value}),
}))

vi.mock('@sanity/ui', () => ({
  Stack: ({children}: ComponentProps<'div'>) => <div>{children}</div>,
  Card: ({children}: ComponentProps<'div'>) => <div>{children}</div>,
  Text: ({children}: {children?: ReactNode}) => <span>{children}</span>,
}))

// @sanity/ui v4 has Autocomplete on its own entry point (see article-tags-input.test.tsx).
vi.mock('@sanity/ui/autocomplete', () => ({
  Autocomplete: (props: AutocompleteShape) => {
    autocomplete(props)
    return <input aria-label="Zoek een wedstrijd" disabled={props.disabled} />
  },
}))

const {MatchbalMatchInput} = await import('./matchbal-match-input')

const ROW = {
  id: 3414,
  date: '2026-11-28T15:00:00.000Z',
  time: '15:00',
  kcvv_team_label: 'U21',
  home_team: {name: 'KCVV Elewijt'},
  away_team: {name: 'Racing Mechelen'},
}
const LINE = 'za 28 nov · 15:00 · U21 · KCVV Elewijt – Racing Mechelen'

const makeProps = (value?: string) => {
  const onChange = vi.fn()
  const props = {
    value,
    onChange,
    readOnly: false,
    elementProps: {id: 'matchId'},
    renderDefault: () => <input aria-label="Wedstrijd-id" defaultValue={value} />,
  } as unknown as StringInputProps
  return {props, onChange}
}

const lastAutocomplete = () => autocomplete.mock.lastCall?.[0]

describe('MatchbalMatchInput (#3920)', () => {
  beforeEach(() => {
    autocomplete.mockClear()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify([ROW])))),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('offers the coming matches from the public web route', async () => {
    render(<MatchbalMatchInput {...makeProps().props} />)

    await waitFor(() => expect(lastAutocomplete()?.options).toEqual([{value: '3414', line: LINE}]))
    expect(fetch).toHaveBeenCalledWith('https://www.kcvvelewijt.be/api/matches/upcoming')
  })

  it('a pick stores the match id', async () => {
    const {props, onChange} = makeProps()
    render(<MatchbalMatchInput {...props} />)
    await waitFor(() => expect(lastAutocomplete()?.options).toHaveLength(1))

    lastAutocomplete()?.onSelect?.('3414')

    expect(onChange).toHaveBeenCalledWith({
      patches: [{type: 'set', value: '3414'}],
    })
  })

  it('a saved Matchbal shows its match line', async () => {
    render(<MatchbalMatchInput {...makeProps('3414').props} />)

    expect(await screen.findByText(LINE)).toBeTruthy()
  })

  it('keeps the plain id field, so an id can still be typed by hand', () => {
    render(<MatchbalMatchInput {...makeProps().props} />)

    expect(screen.getByLabelText('Wedstrijd-id')).toBeTruthy()
  })

  it('says so when the list is down, and the id field stays', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}', {status: 502}))),
    )
    render(<MatchbalMatchInput {...makeProps().props} />)

    expect(await screen.findByText(/wedstrijdlijst is nu niet beschikbaar/)).toBeTruthy()
    expect(screen.getByLabelText('Wedstrijd-id')).toBeTruthy()
  })
})
