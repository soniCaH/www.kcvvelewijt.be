import {at, set} from 'sanity/migrate'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  assertTitleRollbackAllowed,
  migrateTitlePortableTextToString,
} from './title-portable-text-to-string'
import {migrateTitleToPortableText} from './title-to-portable-text'

describe('migrateTitlePortableTextToString', () => {
  it('leaves a string title alone', () => {
    expect(migrateTitlePortableTextToString({title: 'Grote zege'})).toBeUndefined()
  })

  it('skips a Portable Text title with no text', () => {
    expect(migrateTitlePortableTextToString({title: []})).toBeUndefined()
    expect(
      migrateTitlePortableTextToString({
        title: [{children: [{text: ' '}]}],
      }),
    ).toBeUndefined()
  })

  it('joins the spans of the first block', () => {
    expect(
      migrateTitlePortableTextToString({
        title: [{children: [{text: 'Grote '}, {text: 'zege'}]}, {children: [{text: 'genegeerd'}]}],
      }),
    ).toEqual([at('title', set('Grote zege'))])
  })

  it('reverses the forward migration', () => {
    const [forward] = migrateTitleToPortableText({_id: 'a', title: 'Grote zege'}) ?? []
    const title = (forward.op as {value: unknown}).value
    expect(migrateTitlePortableTextToString({title})).toEqual([at('title', set('Grote zege'))])
  })
})

describe('assertTitleRollbackAllowed', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('throws unless ALLOW_TITLE_ROLLBACK is exactly "yes"', () => {
    expect(() => assertTitleRollbackAllowed({})).toThrow(/ALLOW_TITLE_ROLLBACK=yes/)
    expect(() => assertTitleRollbackAllowed({ALLOW_TITLE_ROLLBACK: '1'})).toThrow()
  })

  it('passes with ALLOW_TITLE_ROLLBACK=yes', () => {
    expect(() => assertTitleRollbackAllowed({ALLOW_TITLE_ROLLBACK: 'yes'})).not.toThrow()
  })

  it('guards the migration handler, not module import', async () => {
    const {default: migration} = await import('./title-portable-text-to-string')
    const handler = migration.migrate as {document: (doc: unknown, ctx: unknown) => unknown}
    const doc = {_id: 'a', title: [{children: [{text: 'Grote zege'}]}]}

    vi.stubEnv('ALLOW_TITLE_ROLLBACK', '')
    expect(() => handler.document(doc, {})).toThrow(/rollback-only/)

    vi.stubEnv('ALLOW_TITLE_ROLLBACK', 'yes')
    expect(handler.document(doc, {})).toEqual([at('title', set('Grote zege'))])
  })
})
