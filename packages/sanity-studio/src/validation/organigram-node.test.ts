import {ConcreteRuleClass} from 'sanity'
import {describe, expect, it, vi} from 'vitest'
import {organigramNode} from '@kcvv/sanity-schemas'

/**
 * Field-level test: builds the actual `validation` callback registered on
 * `organigramNode.members[]` against a real `ConcreteRuleClass` and asserts
 * the MARKER LEVEL it emits — not just the helper's return value. This is
 * the shape that regressed silently before (#2929): a plain `Rule.custom(fn)`
 * emits every marker at `error`, no matter what `{level: 'warning'}` object
 * the helper itself returns.
 */
function getMembersItemValidation() {
  const membersField = organigramNode.fields.find(
    (field): field is typeof field & {of: {validation?: unknown}[]} =>
      field.name === 'members',
  )
  if (!membersField || !('of' in membersField)) {
    throw new Error('organigramNode.members field not found or has no `of`')
  }
  const itemDef = (membersField as {of: {validation?: unknown}[]}).of[0]
  const validation = itemDef.validation as (
    rule: InstanceType<typeof ConcreteRuleClass>,
  ) => InstanceType<typeof ConcreteRuleClass>
  return validation
}

function makeContext(doc: Record<string, unknown> | null) {
  return {
    getClient: () => ({fetch: vi.fn().mockResolvedValue(doc)}),
    i18n: {t: (key: string) => key},
    schema: {},
    type: {},
    document: undefined,
    environment: 'test',
    path: [],
  }
}

describe('organigramNode.members[] validation (rule level)', () => {
  it('emits exactly one warning marker (no error) for an archived member', async () => {
    const validation = getMembersItemValidation()
    const rule = validation(new ConcreteRuleClass())
    const ref = {_type: 'reference' as const, _ref: 'staffMember-archived'}
    const context = makeContext({_id: 'staffMember-archived', archived: true})

    const markers = await rule.validate(ref, context as never)

    expect(markers).toHaveLength(1)
    expect(markers[0].level).toBe('warning')
    expect(markers.some((marker) => marker.level === 'error')).toBe(false)
  })

  it('emits no markers for a non-archived member', async () => {
    const validation = getMembersItemValidation()
    const rule = validation(new ConcreteRuleClass())
    const ref = {_type: 'reference' as const, _ref: 'staffMember-active'}
    const context = makeContext({_id: 'staffMember-active', archived: false})

    const markers = await rule.validate(ref, context as never)

    expect(markers).toHaveLength(0)
  })

  it('emits no markers when the reference is missing', async () => {
    const validation = getMembersItemValidation()
    const rule = validation(new ConcreteRuleClass())
    const context = makeContext(null)

    const markers = await rule.validate(undefined, context as never)

    expect(markers).toHaveLength(0)
  })
})
