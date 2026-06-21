import {render, screen} from '@testing-library/react'
import type {ComponentProps} from 'react'
import {describe, expect, it, vi} from 'vitest'

vi.mock('@sanity/ui', () => {
  const passthrough =
    (name: string) =>
    ({children, ...rest}: ComponentProps<'div'>) => (
      <div data-mock={name} {...rest}>
        {children}
      </div>
    )
  return {
    Card: passthrough('Card'),
    Stack: passthrough('Stack'),
    Text: passthrough('Text'),
  }
})

import type {InputProps} from 'sanity'
import {GuideFormInput} from './guide-input'

const DEFAULT_MARKER = 'default-form-render'

function makeProps(overrides: Record<string, unknown>): InputProps {
  return {
    path: [],
    schemaType: {name: 'player'},
    renderDefault: () => <div>{DEFAULT_MARKER}</div>,
    ...overrides,
  } as unknown as InputProps
}

describe('GuideFormInput', () => {
  it('renders the guide above the default form at the document root for a guided type', () => {
    render(<GuideFormInput {...makeProps({})} />)
    expect(screen.getByText('Waar verschijnt dit?')).toBeTruthy()
    expect(screen.getByText(DEFAULT_MARKER)).toBeTruthy()
  })

  it('renders only the default form for a type without a guide entry', () => {
    render(<GuideFormInput {...makeProps({schemaType: {name: 'doesNotExist'}})} />)
    expect(screen.queryByText('Waar verschijnt dit?')).toBeNull()
    expect(screen.getByText(DEFAULT_MARKER)).toBeTruthy()
  })

  it('does not render the guide on nested (non-root) inputs even for a guided type', () => {
    render(<GuideFormInput {...makeProps({path: ['images', 0]})} />)
    expect(screen.queryByText('Waar verschijnt dit?')).toBeNull()
    expect(screen.getByText(DEFAULT_MARKER)).toBeTruthy()
  })
})
