import type {ComponentType} from 'react'
import type {
  ArrayOfPrimitivesInputProps,
  BlockDecoratorProps,
  SchemaTypeDefinition,
  StringInputProps,
} from 'sanity'
import {schemaTypes as baseSchemaTypes} from '@kcvv/sanity-schemas'
import {describe, expect, it} from 'vitest'
import {applyArticleTagsInput} from './inputs/apply-article-tags-input'
import {applyDecoratorComponents} from './inputs/apply-decorator-components'
import {applyRespondentPicker} from './inputs/apply-respondent-picker'

/**
 * Guard #2 (#2278) — graft-target completeness.
 *
 * Every `apply-*` helper grafts a Studio-only concern (an input `component`, a
 * decorator render `component`) onto a `(type, field)` — or a decorator
 * `value` — declared in `@kcvv/sanity-schemas`. Each helper is a *silent no-op*
 * when its target is absent: it returns the input array unchanged. The exact
 * bug this guards shipped in #2275 — `applyRespondentPicker` kept targeting
 * `qaPair.respondentKey` after the field moved onto `qaPairRespondent`, so the
 * picker silently never mounted, yet its unit test passed because the fixture
 * still used the old shape (stale-mock drift).
 *
 * These tests run the real helpers against the REAL base schema with sentinel
 * components and assert the sentinel actually landed. A rename that orphans a
 * graft target turns the helper into a no-op → the sentinel never lands → the
 * suite fails, pointing at the exact target that drifted.
 *
 * Mirrors the production graft composition in `schema-types.ts`.
 */

type Fielded = {name?: string; fields?: Array<Record<string, unknown>>}

const findType = (
  types: readonly SchemaTypeDefinition[],
  name: string,
): Fielded | undefined =>
  types.find((t) => (t as {name?: string}).name === name) as Fielded | undefined

const findField = (
  type: Fielded | undefined,
  fieldName: string,
): Record<string, unknown> | undefined =>
  type?.fields?.find((f) => (f as {name?: string}).name === fieldName)

/**
 * Collect the `component` of every block decorator whose `value` matches,
 * scanning each top-level type's direct `field.of[]` — the exact reach of
 * `applyDecoratorComponents` (it does not recurse into nested object fields),
 * so the assertion matches what the helper can actually graft.
 */
function collectDecoratorComponents(
  types: readonly SchemaTypeDefinition[],
  value: string,
): unknown[] {
  const out: unknown[] = []
  for (const type of types) {
    const fields = (type as {fields?: unknown[]}).fields
    if (!Array.isArray(fields)) continue
    for (const field of fields) {
      const of = (field as {of?: unknown}).of
      if (!Array.isArray(of)) continue
      for (const member of of) {
        // Only block members carry decorators the helper grafts — mirror
        // `applyDecoratorComponents`, which skips non-block members, so the
        // collector's scope matches the helper's reach exactly.
        if (
          !member ||
          typeof member !== 'object' ||
          (member as {type?: string}).type !== 'block'
        ) {
          continue
        }
        const decorators = (member as {marks?: {decorators?: unknown}})?.marks
          ?.decorators
        if (!Array.isArray(decorators)) continue
        for (const d of decorators) {
          if (
            d &&
            typeof d === 'object' &&
            (d as {value?: string}).value === value
          ) {
            out.push((d as {component?: unknown}).component)
          }
        }
      }
    }
  }
  return out
}

const TagsSentinel: ComponentType<ArrayOfPrimitivesInputProps<string>> = () => null
const RespondentSentinel: ComponentType<StringInputProps> = () => null
const PullquoteSentinel: ComponentType<BlockDecoratorProps> = () => null
const AccentSentinel: ComponentType<BlockDecoratorProps> = () => null

describe('schema-types graft targets resolve against the real schema (#2278)', () => {
  it('applyArticleTagsInput lands on the real article.tags field', () => {
    // Pre-check so a rename fails with "target missing" rather than a null deref.
    expect(findField(findType(baseSchemaTypes, 'article'), 'tags')).toBeDefined()

    const grafted = applyArticleTagsInput(baseSchemaTypes, TagsSentinel)
    const tags = findField(findType(grafted, 'article'), 'tags') as {
      components?: {input?: unknown}
    }
    expect(tags.components?.input).toBe(TagsSentinel)
  })

  it('applyRespondentPicker lands on the real qaPairRespondent.respondentKey field', () => {
    expect(
      findField(findType(baseSchemaTypes, 'qaPairRespondent'), 'respondentKey'),
    ).toBeDefined()

    const grafted = applyRespondentPicker(baseSchemaTypes, RespondentSentinel)
    const key = findField(
      findType(grafted, 'qaPairRespondent'),
      'respondentKey',
    ) as {components?: {input?: unknown}}
    expect(key.components?.input).toBe(RespondentSentinel)
  })

  it('applyDecoratorComponents lands on the real pullquote + accent decorators', () => {
    // Both decorators must be declared somewhere reachable in the schema — else
    // the graft is a no-op. pullquote → bio/body fields, accent → title fields.
    expect(
      collectDecoratorComponents(baseSchemaTypes, 'pullquote').length,
    ).toBeGreaterThan(0)
    expect(
      collectDecoratorComponents(baseSchemaTypes, 'accent').length,
    ).toBeGreaterThan(0)

    const grafted = applyDecoratorComponents(baseSchemaTypes, {
      pullquote: PullquoteSentinel,
      accent: AccentSentinel,
    })
    const pullquotes = collectDecoratorComponents(grafted, 'pullquote')
    const accents = collectDecoratorComponents(grafted, 'accent')
    expect(pullquotes.length).toBeGreaterThan(0)
    expect(accents.length).toBeGreaterThan(0)
    expect(pullquotes.every((c) => c === PullquoteSentinel)).toBe(true)
    expect(accents.every((c) => c === AccentSentinel)).toBe(true)
  })
})
