import {ConcreteRuleClass} from 'sanity'
import {describe, expect, it, vi} from 'vitest'
import {
  RESERVED_SHORT_LINK_NAMES,
  shortLink,
  validateShortLinkName,
  validateShortLinkTarget,
} from '@kcvv/sanity-schemas'

/** A client whose `fetch` answers the duplicate count with `taken`. */
function contextWith(taken: number, id = 'shortLink-new') {
  const fetch = vi.fn().mockResolvedValue(taken)
  return {fetch, context: {document: {_id: id}, getClient: () => ({fetch})}}
}

describe('validateShortLinkName', () => {
  it.each(['stage', 'tornooi', 'kampioenen-2027', 'a1'])('accepts %s', async (name) => {
    expect(await validateShortLinkName(name, contextWith(0).context)).toBe(true)
  })

  it.each(['Stage', 'stage/extra', '/stage', 'st age', 'stage.html', 'stagé', 'stage_2', 'stage?x=1'])(
    'rejects the shape of %j',
    async (name) => {
      expect(typeof (await validateShortLinkName(name, contextWith(0).context))).toBe('string')
    },
  )

  it.each(['nieuws', 'club', 'api', 'ongeval'])('rejects the reserved name %s', async (name) => {
    expect(await validateShortLinkName(name, contextWith(0).context)).toMatch(/pagina van de site/)
  })

  it('reserves every name in the constant', async () => {
    for (const name of RESERVED_SHORT_LINK_NAMES) {
      expect(await validateShortLinkName(name, contextWith(0).context), name).toMatch(/pagina van de site/)
    }
  })

  it('keeps every reserved name valid in shape, so the clash guard is what refuses it', () => {
    for (const name of RESERVED_SHORT_LINK_NAMES) expect(name).toMatch(/^[a-z0-9-]+$/)
  })

  it('rejects a duplicate name', async () => {
    expect(await validateShortLinkName('stage', contextWith(1).context)).toMatch(/bestaat al/)
  })

  it('asks for other documents only: the draft and the published twin of this one are ignored', async () => {
    const {fetch, context} = contextWith(0, 'drafts.shortLink-stage')
    await validateShortLinkName('stage', context)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toContain('!(_id in [$id, "drafts." + $id])')
    expect(fetch.mock.calls[0][1]).toEqual({name: 'stage', id: 'shortLink-stage'})
  })

  it('does not hit Sanity for a name it already refuses', async () => {
    const {fetch, context} = contextWith(0)
    await validateShortLinkName('Nieuws', context)
    await validateShortLinkName('nieuws', context)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('lets an empty value through: required() is the field’s own call', async () => {
    expect(await validateShortLinkName(undefined, contextWith(0).context)).toBe(true)
    expect(await validateShortLinkName('', contextWith(0).context)).toBe(true)
  })
})

describe('validateShortLinkTarget', () => {
  it.each([
    'https://www.tournify.nl/live/kcvvelewijt2025',
    '/nieuws/herfststage-2026',
    '/',
    '/hulp#sportongeval',
    '/NIEUWS/herfststage-2026',
    '/?x=1',
    '/nieuws?x=1',
    'https://www.kcvvelewijt.be/nieuws/herfststage-2026',
    'https://kcvvelewijt.be/',
    'https://kcvvelewijt.be.example.com/stage',
  ])('accepts %s', (value) => {
    expect(validateShortLinkTarget(value)).toBe(true)
  })

  it.each([
    'http://example.be',
    'www.example.be',
    'example.be',
    '//evil.com',
    '/\\evil.com',
    '/\t/evil.com',
    '/ spatie',
    'https://',
    'https:// example.be',
    'https:///evil.com',
    'javascript:alert(1)',
    'mailto:info@kcvvelewijt.be',
    'tel:+3212345678',
    '#top',
    'nieuws/herfststage',
    '/stage',
    '/stage/extra',
    '/onbekend?x=1',
    '/onbekend#top',
    '/Stage',
    'https://www.kcvvelewijt.be/stage',
    'https://kcvvelewijt.be/Stage?x=1',
    'https://WWW.KCVVELEWIJT.BE:443/stage',
  ])('rejects %j', (value) => {
    expect(typeof validateShortLinkTarget(value)).toBe('string')
  })

  it('names the loop in the message for an own-site target that is another short link', () => {
    expect(validateShortLinkTarget('/stage')).toMatch(/niet naar een andere korte link/)
  })

  it('lets an empty value through', () => {
    expect(validateShortLinkTarget(undefined)).toBe(true)
    expect(validateShortLinkTarget('')).toBe(true)
  })
})

describe('the production seed (scripts/sanity-ops/src/short-links-3573)', () => {
  it.each([
    ['tornooi', 'https://www.tournify.nl/live/kcvvelewijt2025'],
    ['stage', '/nieuws/herfststage-2026'],
  ])('passes the Studio rules: /%s → %s', async (name, target) => {
    expect(await validateShortLinkName(name, contextWith(0).context)).toBe(true)
    expect(validateShortLinkTarget(target)).toBe(true)
  })
})

describe('shortLink schema (rule level)', () => {
  type Validated = {validation: (rule: InstanceType<typeof ConcreteRuleClass>) => InstanceType<typeof ConcreteRuleClass>}
  const field = (name: string) => {
    const f = shortLink.fields.find((x) => x.name === name)
    if (!f) throw new Error(`shortLink.${name} not found`)
    return f as unknown as Validated
  }
  const run = (name: string, value: unknown, taken = 0) =>
    field(name)
      .validation(new ConcreteRuleClass())
      .validate(value, {
        ...contextWith(taken).context,
        i18n: {t: (key: string) => key},
        schema: {},
        type: {},
        environment: 'test',
        path: [name],
      } as never)

  it('requires both fields', async () => {
    expect(await run('name', undefined)).toHaveLength(1)
    expect(await run('target', undefined)).toHaveLength(1)
  })

  it('wires the validators to the fields', async () => {
    expect(await run('name', 'stage')).toHaveLength(0)
    expect(await run('name', 'Nieuws')).toHaveLength(1)
    expect(await run('name', 'stage', 1)).toHaveLength(1)
    expect(await run('target', '/nieuws/herfststage-2026')).toHaveLength(0)
    expect(await run('target', 'http://example.be')).toHaveLength(1)
  })
})
