import {fireEvent, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const mockSubjects: {current: unknown} = {current: undefined}

vi.mock('sanity', () => ({
  MemberField: ({member}: {member: {name: string}}) => (
    <div data-member={member.name} />
  ),
  MemberFieldError: ({member}: {member: {key: string}}) => (
    <div data-member-error={member.key} />
  ),
  useFormValue: (path: unknown[]) =>
    Array.isArray(path) && path[0] === 'subjects' ? mockSubjects.current : undefined,
}))

vi.mock('@sanity/icons', () => ({
  TrashIcon: () => null,
  ChevronDownIcon: () => null,
  ChevronRightIcon: () => null,
}))

vi.mock('@sanity/ui', () => {
  type P = {children?: React.ReactNode}
  const Box = ({children}: P) => <div>{children}</div>
  const Stack = ({children}: P) => <div>{children}</div>
  const Flex = ({children}: P) => <div>{children}</div>
  const Card = ({children}: P) => <div>{children}</div>
  const Text = ({children}: P) => <span>{children}</span>
  const Button = ({
    onClick,
    text,
    children,
    ...rest
  }: {
    onClick?: () => void
    text?: string
    children?: React.ReactNode
    ['aria-label']?: string
  }) => (
    <button type="button" onClick={onClick} aria-label={rest['aria-label']}>
      {text ?? children}
    </button>
  )
  return {Box, Stack, Flex, Card, Text, Button}
})

import {QaPairItem, QaPairRespondentItem} from './qa-block-inline'

type ItemProps = Parameters<typeof QaPairItem>[0]

const defaultMembers = [
  {kind: 'field', key: 'k-respondentKey', name: 'respondentKey'},
  {kind: 'field', key: 'k-answer', name: 'answer'},
]

const makeProps = (
  over: {
    members?: unknown[]
    onRemove?: () => void
    readOnly?: boolean
    index?: number
    collapsed?: boolean
    collapsible?: boolean
    onCollapse?: () => void
    onExpand?: () => void
    title?: string
  } = {},
): ItemProps =>
  ({
    inputProps: {
      members: over.members ?? defaultMembers,
      renderField: vi.fn(),
      renderInput: vi.fn(),
      renderItem: vi.fn(),
      renderPreview: vi.fn(),
      renderAnnotation: vi.fn(),
      renderBlock: vi.fn(),
      renderInlineBlock: vi.fn(),
    },
    onRemove: over.onRemove ?? vi.fn(),
    readOnly: over.readOnly ?? false,
    index: over.index ?? 0,
    collapsed: over.collapsed,
    collapsible: over.collapsible ?? true,
    onCollapse: over.onCollapse ?? vi.fn(),
    onExpand: over.onExpand ?? vi.fn(),
    title: over.title,
  }) as unknown as ItemProps

describe('QaPairRespondentItem', () => {
  beforeEach(() => {
    mockSubjects.current = undefined
  })

  it('renders every field member inline (RespondentPicker + answer) on a duo', () => {
    mockSubjects.current = [{_key: 'a'}, {_key: 'b'}]
    const {container} = render(<QaPairRespondentItem {...makeProps()} />)
    expect(container.querySelector('[data-member="respondentKey"]')).not.toBeNull()
    expect(container.querySelector('[data-member="answer"]')).not.toBeNull()
  })

  it('hides the respondent picker on single-subject interviews', () => {
    mockSubjects.current = [{_key: 'only'}]
    const {container} = render(<QaPairRespondentItem {...makeProps()} />)
    expect(container.querySelector('[data-member="respondentKey"]')).toBeNull()
    // The answer editor still renders.
    expect(container.querySelector('[data-member="answer"]')).not.toBeNull()
  })

  it('hides the picker when the article has no subjects yet', () => {
    mockSubjects.current = undefined
    const {container} = render(<QaPairRespondentItem {...makeProps()} />)
    expect(container.querySelector('[data-member="respondentKey"]')).toBeNull()
  })

  it('removes the respondent via onRemove', () => {
    mockSubjects.current = [{_key: 'a'}, {_key: 'b'}]
    const onRemove = vi.fn()
    render(<QaPairRespondentItem {...makeProps({onRemove})} />)
    fireEvent.click(screen.getByRole('button', {name: 'Verwijder respondent'}))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('hides the remove control when readOnly', () => {
    mockSubjects.current = [{_key: 'a'}, {_key: 'b'}]
    render(<QaPairRespondentItem {...makeProps({readOnly: true})} />)
    expect(screen.queryByRole('button', {name: 'Verwijder respondent'})).toBeNull()
  })
})

describe('QaPairItem', () => {
  it('renders the question title and all field members when expanded', () => {
    const {container} = render(
      <QaPairItem {...makeProps({title: 'Wat was het keerpunt?'})} />,
    )
    expect(screen.getByText('Wat was het keerpunt?')).toBeTruthy()
    expect(container.querySelector('[data-member="answer"]')).not.toBeNull()
  })

  it('falls back to a numbered heading when there is no question yet', () => {
    render(<QaPairItem {...makeProps({index: 2, title: undefined})} />)
    expect(screen.getByText('Vraag 3')).toBeTruthy()
  })

  it('hides the field members when collapsed', () => {
    const {container} = render(
      <QaPairItem {...makeProps({collapsed: true, title: 'Q'})} />,
    )
    expect(container.querySelector('[data-member="answer"]')).toBeNull()
    expect(screen.getByText('Q')).toBeTruthy()
  })

  it('expands via the collapse toggle when collapsed', () => {
    const onExpand = vi.fn()
    render(<QaPairItem {...makeProps({collapsed: true, onExpand})} />)
    fireEvent.click(screen.getByRole('button', {name: 'Klap vraag open'}))
    expect(onExpand).toHaveBeenCalledTimes(1)
  })

  it('removes the pair via onRemove', () => {
    const onRemove = vi.fn()
    render(<QaPairItem {...makeProps({onRemove})} />)
    fireEvent.click(screen.getByRole('button', {name: 'Verwijder vraag'}))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})
