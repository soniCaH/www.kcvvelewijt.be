import {fireEvent, render, screen} from '@testing-library/react'
import {type ComponentProps, type FocusEvent, type KeyboardEvent, forwardRef} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

type AutocompleteShape = {
  id: string
  placeholder?: string
  value?: string
  options?: Array<{value: string}>
  onQueryChange?: (query: string | null) => void
  onSelect?: (value: string) => void
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void
  disabled?: boolean
}

const mockClient = {fetch: vi.fn<() => Promise<unknown[]>>()}

vi.mock('sanity', () => {
  const PatchEvent = {
    from: (patches: unknown) => ({patches: Array.isArray(patches) ? patches : [patches]}),
  }
  return {
    PatchEvent,
    insert: (items: unknown[], position: string, path: unknown[]) => ({
      type: 'insert',
      items,
      position,
      path,
    }),
    setIfMissing: (value: unknown) => ({type: 'setIfMissing', value}),
    unset: (path: unknown[]) => ({type: 'unset', path}),
    useClient: () => mockClient,
  }
})

vi.mock('@sanity/ui', () => {
  const Stack = ({children}: ComponentProps<'div'>) => <div data-mock="Stack">{children}</div>
  const Flex = ({children}: ComponentProps<'div'>) => <div data-mock="Flex">{children}</div>
  const Card = ({children}: ComponentProps<'div'>) => <div data-mock="Card">{children}</div>
  const Text = ({children}: ComponentProps<'span'>) => <span data-mock="Text">{children}</span>
  const Button = ({
    onClick,
    'aria-label': ariaLabel,
  }: {onClick?: () => void; 'aria-label'?: string}) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel} />
  )
  const Autocomplete = forwardRef<HTMLInputElement, AutocompleteShape>(function Autocomplete(
    {id, placeholder, onQueryChange, onKeyDown, onBlur, onFocus, disabled},
    ref,
  ) {
    return (
      <input
        ref={ref}
        id={id}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onQueryChange?.(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        onFocus={onFocus}
        data-testid="tags-autocomplete"
      />
    )
  })
  return {Stack, Flex, Card, Text, Button, Autocomplete}
})

vi.mock('@sanity/icons', () => ({CloseIcon: () => null}))

import {ArticleTagsInput} from './article-tags-input'

type Patch = {type: string; [key: string]: unknown}
type FakePatchEvent = {patches: Patch[]}
type TestProps = Parameters<typeof ArticleTagsInput>[0]

const makeProps = (
  override: Partial<{value: string[]; onChange: (event: FakePatchEvent) => void}> = {},
): TestProps => {
  const onChange = override.onChange ?? vi.fn<(event: FakePatchEvent) => void>()
  return {
    value: override.value,
    onChange,
    readOnly: false,
    elementProps: {
      id: 'tags-input',
      onBlur: vi.fn(),
      onFocus: vi.fn(),
      ref: {current: null},
    },
  } as unknown as TestProps
}

describe('ArticleTagsInput', () => {
  beforeEach(() => {
    mockClient.fetch.mockReset()
    mockClient.fetch.mockResolvedValue(['Jeugd', 'Dames'])
  })

  it('commits a new tag on Enter with setIfMissing + insert patches', () => {
    const onChange = vi.fn<(event: FakePatchEvent) => void>()
    const props = makeProps({onChange})
    render(<ArticleTagsInput {...props} />)
    const input = screen.getByTestId('tags-autocomplete') as HTMLInputElement
    fireEvent.change(input, {target: {value: 'Nieuw'}})
    fireEvent.keyDown(input, {key: 'Enter'})

    expect(onChange).toHaveBeenCalledTimes(1)
    const emitted = onChange.mock.calls[0][0]
    expect(emitted.patches).toEqual([
      {type: 'setIfMissing', value: []},
      {type: 'insert', items: ['Nieuw'], position: 'before', path: [0]},
    ])
  })

  it('composes elementProps.onBlur before committing', () => {
    const props = makeProps()
    render(<ArticleTagsInput {...props} />)
    const input = screen.getByTestId('tags-autocomplete') as HTMLInputElement
    fireEvent.change(input, {target: {value: 'Nieuw'}})
    fireEvent.blur(input)

    expect(props.elementProps.onBlur).toHaveBeenCalledTimes(1)
    expect(props.onChange).toHaveBeenCalledTimes(1)
  })

  it('removes the last tag on Backspace when draft is empty', () => {
    const onChange = vi.fn<(event: FakePatchEvent) => void>()
    const props = makeProps({onChange, value: ['Jeugd', 'Dames']})
    render(<ArticleTagsInput {...props} />)
    const input = screen.getByTestId('tags-autocomplete') as HTMLInputElement
    fireEvent.keyDown(input, {key: 'Backspace'})

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0].patches).toEqual([{type: 'unset', path: [1]}])
  })

  it('appends after last index when array is non-empty', () => {
    const onChange = vi.fn<(event: FakePatchEvent) => void>()
    const props = makeProps({onChange, value: ['Jeugd']})
    render(<ArticleTagsInput {...props} />)
    const input = screen.getByTestId('tags-autocomplete') as HTMLInputElement
    fireEvent.change(input, {target: {value: 'Dames'}})
    fireEvent.keyDown(input, {key: 'Enter'})

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0].patches).toEqual([
      {type: 'setIfMissing', value: []},
      {type: 'insert', items: ['Dames'], position: 'after', path: [0]},
    ])
  })

  it('does not commit when the draft is blank on Enter', () => {
    const onChange = vi.fn<(event: FakePatchEvent) => void>()
    const props = makeProps({onChange})
    render(<ArticleTagsInput {...props} />)
    const input = screen.getByTestId('tags-autocomplete') as HTMLInputElement
    fireEvent.keyDown(input, {key: 'Enter'})

    expect(onChange).not.toHaveBeenCalled()
  })
})
