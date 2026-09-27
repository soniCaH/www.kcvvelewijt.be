import {at, set} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {migrateTitleToPortableText} from './title-to-portable-text'

describe('migrateTitleToPortableText', () => {
  it('skips a title that is already Portable Text', () => {
    expect(
      migrateTitleToPortableText({
        _id: 'a',
        title: [{_type: 'block', children: []}],
      }),
    ).toBeUndefined()
  })

  it('skips a missing or blank title', () => {
    expect(migrateTitleToPortableText({_id: 'a'})).toBeUndefined()
    expect(migrateTitleToPortableText({_id: 'a', title: '   '})).toBeUndefined()
  })

  it('wraps a string title in one block with keys derived from the document id', () => {
    expect(
      migrateTitleToPortableText({
        _id: 'drafts.article-123-abc-xyz',
        title: 'Grote zege',
      }),
    ).toEqual([
      at(
        'title',
        set([
          {
            _type: 'block',
            _key: 'title_draftsarticl',
            style: 'normal',
            markDefs: [],
            children: [
              {
                _type: 'span',
                _key: 'span_draftsarticl',
                text: 'Grote zege',
                marks: [],
              },
            ],
          },
        ]),
      ),
    ])
  })
})
