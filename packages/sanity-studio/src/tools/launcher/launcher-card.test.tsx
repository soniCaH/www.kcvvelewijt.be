import {fireEvent, render, screen} from '@testing-library/react'
import type {ComponentProps} from 'react'
import {describe, expect, it, vi} from 'vitest'

vi.mock('@sanity/ui', () => {
  const Card = ({children, onClick, onKeyDown, role, tabIndex, ...rest}: ComponentProps<'div'>) => (
    <div
      data-mock="Card"
      role={role}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={onKeyDown}
      {...rest}
    >
      {children}
    </div>
  )
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
  const Text = ({children, ...rest}: ComponentProps<'div'>) => (
    <div data-mock="Text" {...rest}>
      {children}
    </div>
  )
  const Badge = ({children, ...rest}: ComponentProps<'div'>) => (
    <span data-mock="Badge" {...rest}>
      {children}
    </span>
  )
  return {Card, Stack, Flex, Text, Badge}
})

import {LauncherCard} from './launcher-card'
import type {LauncherTemplate} from '../../templates/types'

const template: LauncherTemplate = {
  id: 'responsibility-new',
  title: 'Nieuwe responsibility',
  schemaType: 'responsibility',
  value: {},
  ui: {
    icon: 'help-circle',
    description: 'Voor info-paden zoals "Hoe meld ik een blessure?"',
    group: 'Responsibilities',
  },
}

describe('LauncherCard', () => {
  it('renders the template title, description, and schemaType badge', () => {
    render(<LauncherCard template={template} onSelect={() => undefined} />)
    expect(screen.getByText('Nieuwe responsibility')).toBeTruthy()
    expect(screen.getByText(/Voor info-paden/)).toBeTruthy()
    expect(screen.getByText('responsibility')).toBeTruthy()
  })

  it('exposes the schemaType as a data attribute for downstream consumers', () => {
    const {container} = render(<LauncherCard template={template} onSelect={() => undefined} />)
    const card = container.querySelector('[data-testid="launcher-card-responsibility-new"]')
    expect(card?.getAttribute('data-schema-type')).toBe('responsibility')
  })

  it('calls onSelect with the template when clicked', () => {
    const onSelect = vi.fn()
    render(<LauncherCard template={template} onSelect={onSelect} />)
    fireEvent.click(screen.getByTestId('launcher-card-responsibility-new'))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(template)
  })

  it('calls onSelect when Enter is pressed (keyboard a11y)', () => {
    const onSelect = vi.fn()
    render(<LauncherCard template={template} onSelect={onSelect} />)
    fireEvent.keyDown(screen.getByTestId('launcher-card-responsibility-new'), {key: 'Enter'})
    expect(onSelect).toHaveBeenCalledWith(template)
  })

  it('calls onSelect when Space is pressed (keyboard a11y)', () => {
    const onSelect = vi.fn()
    render(<LauncherCard template={template} onSelect={onSelect} />)
    fireEvent.keyDown(screen.getByTestId('launcher-card-responsibility-new'), {key: ' '})
    expect(onSelect).toHaveBeenCalledWith(template)
  })

  it('does not call onSelect for unrelated keys', () => {
    const onSelect = vi.fn()
    render(<LauncherCard template={template} onSelect={onSelect} />)
    fireEvent.keyDown(screen.getByTestId('launcher-card-responsibility-new'), {key: 'a'})
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('renders as a button-role with a tabIndex (keyboard-focusable)', () => {
    render(<LauncherCard template={template} onSelect={() => undefined} />)
    const card = screen.getByTestId('launcher-card-responsibility-new')
    expect(card.getAttribute('role')).toBe('button')
    expect(card.getAttribute('tabIndex')).toBe('0')
  })
})
