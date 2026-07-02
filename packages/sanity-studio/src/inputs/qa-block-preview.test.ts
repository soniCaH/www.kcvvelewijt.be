import {describe, expect, it} from 'vitest'
import {qaPairRespondent} from '@kcvv/sanity-schemas'

type Prepare = (sel: {respondentKey?: unknown; answer?: unknown}) => {
  title?: string
  subtitle?: string
}

const prepare = (
  qaPairRespondent as unknown as {preview: {prepare: Prepare}}
).preview.prepare

const answer = (text: string) => [
  {_type: 'block', _key: 'b', children: [{_type: 'span', _key: 's', text}]},
]

describe('qaPairRespondent preview', () => {
  it('maps the __all__ sentinel to "Allen (unaniem)"', () => {
    expect(prepare({respondentKey: '__all__', answer: answer('X')}).title).toBe(
      'Allen (unaniem)',
    )
  })

  it('never surfaces the raw respondentKey for a normal key', () => {
    const out = prepare({respondentKey: 'e3fab6ca373d', answer: answer('Hallo')})
    expect(out.title).toBe('Respondent')
    expect(out.title).not.toContain('e3fab')
  })

  it('uses the answer text as the subtitle', () => {
    expect(
      prepare({respondentKey: 'x', answer: answer('Het keerpunt was de stage.')})
        .subtitle,
    ).toBe('Het keerpunt was de stage.')
  })

  it('returns no subtitle for an empty or missing answer', () => {
    expect(prepare({respondentKey: 'x', answer: []}).subtitle).toBeUndefined()
    expect(prepare({respondentKey: 'x', answer: undefined}).subtitle).toBeUndefined()
  })
})
