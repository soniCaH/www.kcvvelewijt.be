import {ConcreteRuleClass} from 'sanity'
import {describe, expect, it} from 'vitest'
import {responsibility, staffMember} from '@kcvv/sanity-schemas'

/**
 * Field-level: the real `validation` registered on each email field, run
 * through a real `ConcreteRuleClass` declared as a string (what Sanity does for
 * a live field).
 */
type Node = {
  name?: string
  fields?: Node[]
  of?: Node[]
  validation?: unknown
}

function find(node: Node, path: string[]): Node {
  const [head, ...rest] = path
  const queue = [...(node.fields ?? []), ...(node.of ?? [])]
  while (queue.length) {
    const child = queue.shift() as Node
    if (child.name === head) return rest.length ? find(child, rest) : child
    if (!child.name) queue.push(...(child.fields ?? []), ...(child.of ?? []))
  }
  throw new Error(`path segment "${head}" not found`)
}

async function markersFor(root: unknown, path: string[], value: unknown) {
  const field = find(root as Node, path)
  const validation = field.validation as (
    rule: InstanceType<typeof ConcreteRuleClass>,
  ) => InstanceType<typeof ConcreteRuleClass>
  if (typeof validation !== 'function') throw new Error(`${path.join('.')} has no validation`)
  const rule = validation(new ConcreteRuleClass().type('String'))
  const context = {parent: {}, document: {}, i18n: {t: (key: string) => key}, schema: {}, type: {}, environment: 'test', path}
  return rule.validate(value, context as never)
}

const EMAIL_FIELDS: Array<[string, unknown, string[]]> = [
  ['staffMember.email', staffMember, ['email']],
  ['responsibility primaryContact email', responsibility, ['primaryContact', 'email']],
  ['responsibility step contact email', responsibility, ['steps', 'solutionStep', 'contact', 'email']],
]

describe.each(EMAIL_FIELDS)('%s (rule level)', (_label, root, path) => {
  it('rejects not-an-email', async () => {
    const markers = await markersFor(root, path, 'not-an-email')
    expect(markers.some((m) => m.level === 'error')).toBe(true)
  })

  it('accepts a real address and an empty value', async () => {
    expect(await markersFor(root, path, 'kevin@kcvvelewijt.be')).toHaveLength(0)
    expect(await markersFor(root, path, undefined)).toHaveLength(0)
  })
})
