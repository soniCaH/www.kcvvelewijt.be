import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {type ComponentProps} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const mockClient = {
  fetch: vi.fn<(query: string, params?: Record<string, unknown>) => Promise<unknown[]>>(),
}
const mockSubjects: {current: unknown} = {current: undefined}

vi.mock('sanity', () => {
  const PatchEvent = {
    from: (patches: unknown) => ({patches: Array.isArray(patches) ? patches : [patches]}),
  }
  return {
    PatchEvent,
    set: (value: unknown) => ({type: 'set', value}),
    unset: () => ({type: 'unset'}),
    useClient: () => mockClient,
    useFormValue: (path: unknown[]) => {
      const first = Array.isArray(path) ? path[0] : undefined
      if (first === 'subjects') return mockSubjects.current
      return undefined
    },
  }
})

vi.mock('@sanity/ui', () => {
  const Stack = ({children, ...rest}: ComponentProps<'div'>) => (
    <div data-mock="Stack" {...rest}>
      {children}
    </div>
  )
  const Flex = ({children, ...rest}: ComponentProps<'div'>) => (
    <div data-mock="Flex" {...rest}>
      {children}
    </div>
  )
  const Card = ({children, ...rest}: ComponentProps<'div'>) => (
    <div data-mock="Card" {...rest}>
      {children}
    </div>
  )
  const Text = ({children, ...rest}: ComponentProps<'span'>) => (
    <span data-mock="Text" {...rest}>
      {children}
    </span>
  )
  const Radio = (props: ComponentProps<'input'>) => <input type="radio" {...props} />
  return {Stack, Flex, Card, Text, Radio}
})

import {RespondentPicker} from './respondent-picker'

type Patch = {type: string; [key: string]: unknown}
type FakePatchEvent = {patches: Patch[]}
type TestProps = Parameters<typeof RespondentPicker>[0]

const makeProps = (
  override: Partial<{value: string; onChange: (event: FakePatchEvent) => void; readOnly: boolean}> = {},
): TestProps => ({
  value: override.value,
  onChange: override.onChange ?? vi.fn<(event: FakePatchEvent) => void>(),
  readOnly: override.readOnly ?? false,
  elementProps: {
    id: 'respondent-key-input',
    onBlur: vi.fn(),
    onFocus: vi.fn(),
    ref: {current: null},
  },
} as unknown as TestProps)

describe('RespondentPicker', () => {
  beforeEach(() => {
    mockClient.fetch.mockReset()
    mockClient.fetch.mockResolvedValue([])
    mockSubjects.current = undefined
  })

  it('renders an empty-state card when no subjects are defined', () => {
    mockSubjects.current = []
    render(<RespondentPicker {...makeProps()} />)
    expect(screen.getByText(/Voeg eerst subjects toe/i)).toBeTruthy()
  })

  it('renders a radio option per subject with resolved player names', async () => {
    mockSubjects.current = [
      {_key: 'k1', kind: 'player', playerRef: {_ref: 'player-1'}},
      {_key: 'k2', kind: 'player', playerRef: {_ref: 'player-2'}},
    ]
    mockClient.fetch.mockResolvedValue([
      {_id: 'player-1', firstName: 'Maxim', lastName: 'Breugelmans'},
      {_id: 'player-2', firstName: 'Jeroen', lastName: 'Van den Berghe'},
    ])

    render(<RespondentPicker {...makeProps()} />)

    await waitFor(() => {
      expect(screen.getByText('Maxim Breugelmans')).toBeTruthy()
      expect(screen.getByText('Jeroen Van den Berghe')).toBeTruthy()
    })
  })

  it('shows a loading label until the player/staff deref resolves', () => {
    mockSubjects.current = [{_key: 'k1', kind: 'player', playerRef: {_ref: 'player-1'}}]
    // Unresolved promise — stays pending; label should fall through to loading text.
    mockClient.fetch.mockImplementation(() => new Promise(() => {}))
    render(<RespondentPicker {...makeProps()} />)
    expect(screen.getByText(/Speler \(laden…\)/i)).toBeTruthy()
  })

  it('uses customName as the label for custom subjects', () => {
    mockSubjects.current = [
      {_key: 'k1', kind: 'custom', customName: 'Trainer X'},
    ]
    render(<RespondentPicker {...makeProps()} />)
    expect(screen.getByText('Trainer X')).toBeTruthy()
  })

  it('fires a `set` patch when a radio is selected', async () => {
    mockSubjects.current = [
      {_key: 'k1', kind: 'player', playerRef: {_ref: 'player-1'}},
      {_key: 'k2', kind: 'player', playerRef: {_ref: 'player-2'}},
    ]
    mockClient.fetch.mockResolvedValue([
      {_id: 'player-1', firstName: 'Maxim', lastName: 'Breugelmans'},
      {_id: 'player-2', firstName: 'Jeroen', lastName: 'Van den Berghe'},
    ])
    const onChange = vi.fn<(event: FakePatchEvent) => void>()

    render(<RespondentPicker {...makeProps({onChange})} />)

    const radios = await screen.findAllByRole('radio')
    fireEvent.click(radios[1])

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0].patches).toEqual([{type: 'set', value: 'k2'}])
  })

  it('disables all radios when readOnly', async () => {
    mockSubjects.current = [
      {_key: 'k1', kind: 'custom', customName: 'Trainer X'},
      {_key: 'k2', kind: 'custom', customName: 'Supporter Y'},
    ]
    render(<RespondentPicker {...makeProps({readOnly: true})} />)
    const radios = await screen.findAllByRole('radio')
    expect(radios.every((r) => (r as HTMLInputElement).disabled)).toBe(true)
  })

  it('deduplicates ref ids passed to the client fetch', async () => {
    mockSubjects.current = [
      {_key: 'k1', kind: 'player', playerRef: {_ref: 'player-1'}},
      {_key: 'k2', kind: 'player', playerRef: {_ref: 'player-1'}},
    ]
    mockClient.fetch.mockResolvedValue([
      {_id: 'player-1', firstName: 'Maxim', lastName: 'Breugelmans'},
    ])

    render(<RespondentPicker {...makeProps()} />)

    await waitFor(() => {
      expect(mockClient.fetch).toHaveBeenCalledTimes(1)
    })
    const call = mockClient.fetch.mock.calls[0]
    const params = call[1] as {ids: string[]} | undefined
    expect(params?.ids).toEqual(['player-1'])
  })
})
