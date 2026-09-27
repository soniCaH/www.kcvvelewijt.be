import {at, set} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {migrateTitlePortableTextToString} from './title-portable-text-to-string'
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
