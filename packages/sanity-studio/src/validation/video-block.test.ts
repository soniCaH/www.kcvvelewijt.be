import {ConcreteRuleClass} from 'sanity'
import {describe, expect, it, vi} from 'vitest'
import {videoBlock} from '@kcvv/sanity-schemas'

/**
 * Field-level test: builds the actual `validation` callback registered on
 * `videoBlock.uploadedFile` against a real `ConcreteRuleClass` and asserts
 * the MARKER LEVEL it emits. Before the fix, the size guard was a plain
 * `Rule.custom(fn)` — every marker it produced came out at `error`,
 * disabling Publish for an oversized-but-otherwise-valid upload, even
 * though the validator itself only ever intended a hint.
 */
function getUploadedFileValidation() {
  const field = videoBlock.fields.find((f) => f.name === 'uploadedFile')
  if (!field) throw new Error('videoBlock.uploadedFile field not found')
  const validation = field.validation as (
    rule: InstanceType<typeof ConcreteRuleClass>,
  ) => InstanceType<typeof ConcreteRuleClass>
  return validation
}

function makeContext(asset: {size?: number} | null) {
  return {
    getClient: () => ({fetch: vi.fn().mockResolvedValue(asset)}),
    i18n: {t: (key: string) => key},
    schema: {},
    type: {},
    document: undefined,
    environment: 'test',
    path: [],
  }
}

describe('videoBlock.uploadedFile validation (rule level)', () => {
  it('emits exactly one warning marker (no error) for an oversized upload', async () => {
    const validation = getUploadedFileValidation()
    const rule = validation(new ConcreteRuleClass())
    const value = {asset: {_ref: 'file-asset-big'}}
    const context = makeContext({size: 10 * 1024 ** 3})

    const markers = await rule.validate(value, context as never)

    expect(markers).toHaveLength(1)
    expect(markers[0].level).toBe('warning')
    expect(markers.some((marker) => marker.level === 'error')).toBe(false)
  })

  it('emits no markers for an upload under the soft size threshold', async () => {
    const validation = getUploadedFileValidation()
    const rule = validation(new ConcreteRuleClass())
    const value = {asset: {_ref: 'file-asset-small'}}
    const context = makeContext({size: 1024})

    const markers = await rule.validate(value, context as never)

    expect(markers).toHaveLength(0)
  })

  it('emits no markers when no file asset is referenced', async () => {
    const validation = getUploadedFileValidation()
    const rule = validation(new ConcreteRuleClass())
    const context = makeContext(null)

    const markers = await rule.validate(undefined, context as never)

    expect(markers).toHaveLength(0)
  })
})
