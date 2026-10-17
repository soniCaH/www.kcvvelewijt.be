import {ConcreteRuleClass} from 'sanity'
import {describe, expect, it} from 'vitest'
import {
  article,
  jeugdLandingPage,
  matchesSliderPlaceholder,
  responsibility,
  validateLink,
} from '@kcvv/sanity-schemas'

describe('validateLink', () => {
  it.each(['/jeugd/visie', '/', '#top', 'https://example.be', 'http://example.be', 'mailto:a@b.be', 'tel:+32475123456'])(
    'accepts %s',
    (value) => {
      expect(validateLink(value)).toBe(true)
    },
  )

  it.each(['www.example.be', '//evil.com', '/\\evil.com', 'javascript:alert(1)', 'example.be', 'ftp://example.be'])(
    'rejects %s',
    (value) => {
      expect(typeof validateLink(value)).toBe('string')
    },
  )

  it('is case-insensitive on the scheme', () => {
    expect(validateLink('HTTPS://example.be')).toBe(true)
    expect(validateLink('MAILTO:a@b.be')).toBe(true)
  })

  it('passes an empty or missing value (required-ness is the field’s job)', () => {
    expect(validateLink(undefined)).toBe(true)
    expect(validateLink('')).toBe(true)
  })
})

/**
 * Field-level: walk the real schema to each link field and run its registered
 * `validation` through a real `ConcreteRuleClass`. Proves the validator is
 * actually attached, not only that the helper works.
 */
type Node = {
  name?: string
  fields?: Node[]
  of?: Node[]
  marks?: {annotations?: Node[]}
  validation?: unknown
  type?: string
}

function children(node: Node): Node[] {
  return [...(node.fields ?? []), ...(node.of ?? []), ...(node.marks?.annotations ?? [])]
}

/** Resolve a named path; unnamed array members / blocks are transparent. */
function resolve(node: Node, path: string[]): Node {
  if (path.length === 0) return node
  const [head, ...rest] = path
  const queue = children(node)
  while (queue.length) {
    const child = queue.shift() as Node
    if (child.name === head) return resolve(child, rest)
    if (!child.name) queue.push(...children(child))
  }
  throw new Error(`path segment "${head}" not found`)
}

async function markersFor(root: unknown, path: string[], value: unknown) {
  const field = resolve(root as Node, path)
  const validation = field.validation as (rule: InstanceType<typeof ConcreteRuleClass>) => InstanceType<typeof ConcreteRuleClass>
  if (typeof validation !== 'function') throw new Error(`${path.join('.')} has no validation`)
  // Sanity declares the base type on the rule when it validates a real field
  // (`url` is a string); `.uri()` needs it, so mirror that here.
  const rule = validation(new ConcreteRuleClass().type('String'))
  const context = {
    parent: {},
    document: {},
    i18n: {t: (key: string) => key},
    schema: {},
    type: {},
    environment: 'test',
    path,
  }
  return rule.validate(value, context as never)
}

const LINK_FIELDS: Array<{label: string; root: unknown; path: string[]; type: string}> = [
  {label: 'jeugdLandingPage card href', root: jeugdLandingPage, path: ['editorialCards', 'href'], type: 'url'},
  {label: 'article body link href', root: article, path: ['body', 'link', 'href'], type: 'url'},
  {label: 'article callToAction href', root: article, path: ['callToAction', 'href'], type: 'url'},
  {label: 'responsibility step link', root: responsibility, path: ['steps', 'solutionStep', 'link'], type: 'url'},
  {label: 'matchesSliderPlaceholder announcementHref', root: matchesSliderPlaceholder, path: ['announcementHref'], type: 'url'},
]

describe.each(LINK_FIELDS)('$label (rule level)', ({root, path, type}) => {
  it('is a url field', () => {
    expect(resolve(root as Node, path).type).toBe(type)
  })

  it.each(['www.example.be', '//evil.com', '/\\evil.com'])('rejects %s', async (value) => {
    const markers = await markersFor(root, path, value)
    expect(markers.some((m) => m.level === 'error')).toBe(true)
  })

  it.each(['/jeugd/visie', 'https://example.be'])('accepts %s', async (value) => {
    expect(await markersFor(root, path, value)).toHaveLength(0)
  })
})

describe('mailto: and tel: stay rejected where .uri() is http/https only', () => {
  it.each([
    ['responsibility step link', responsibility, ['steps', 'solutionStep', 'link']],
    ['matchesSliderPlaceholder announcementHref', matchesSliderPlaceholder, ['announcementHref']],
  ] as const)('%s', async (_label, root, path) => {
    for (const value of ['mailto:a@b.be', 'tel:+32475123456']) {
      const markers = await markersFor(root, [...path], value)
      expect(markers.some((m) => m.level === 'error')).toBe(true)
    }
  })
})
