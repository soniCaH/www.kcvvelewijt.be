import {at, set, unset} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {
  type ArticleWithQaDoc,
  migrateQaPairRespondents,
} from './qa-pair-respondents'

const stableKey = () => 'fixed-key'

const SAMPLE_ANSWER = [
  {
    _type: 'block',
    _key: 'span-1',
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: 's', text: 'Antwoord.', marks: []}],
  },
]

describe('migrateQaPairRespondents', () => {
  it('returns undefined when body is missing', () => {
    expect(migrateQaPairRespondents({_id: 'no-body'}, stableKey)).toBeUndefined()
  })

  it('returns undefined when body has no qaBlock entries', () => {
    const doc: ArticleWithQaDoc = {
      _id: 'no-qa',
      body: [
        {_type: 'block', _key: 'b-1', children: []},
        {_type: 'transferFact', _key: 't-1'},
      ],
    }
    expect(migrateQaPairRespondents(doc, stableKey)).toBeUndefined()
  })

  it('skips a pair that already has respondents[] populated', () => {
    const doc: ArticleWithQaDoc = {
      _id: 'already-migrated',
      body: [
        {
          _type: 'qaBlock',
          _key: 'qb-1',
          pairs: [
            {
              _key: 'p-1',
              question: 'Q?',
              respondents: [
                {
                  _type: 'qaPairRespondent',
                  _key: 'r-1',
                  respondentKey: 'subj-a',
                  answer: SAMPLE_ANSWER,
                },
              ],
            },
          ],
        },
      ],
    }
    expect(migrateQaPairRespondents(doc, stableKey)).toBeUndefined()
  })

  it('wraps a legacy single-respondent qaPair into respondents[]', () => {
    const doc: ArticleWithQaDoc = {
      _id: 'needs-migration',
      body: [
        {
          _type: 'qaBlock',
          _key: 'qb-1',
          pairs: [
            {
              _key: 'p-1',
              question: 'Q?',
              answer: SAMPLE_ANSWER,
              respondentKey: 'subj-a',
              tag: 'key',
            },
          ],
        },
      ],
    }
    const patches = migrateQaPairRespondents(doc, stableKey)
    expect(patches).toEqual([
      at(
        'body[_key=="qb-1"].pairs[_key=="p-1"].respondents',
        set([
          {
            _type: 'qaPairRespondent',
            _key: 'fixed-key',
            respondentKey: 'subj-a',
            answer: SAMPLE_ANSWER,
          },
        ]),
      ),
      at('body[_key=="qb-1"].pairs[_key=="p-1"].answer', unset()),
      at('body[_key=="qb-1"].pairs[_key=="p-1"].respondentKey', unset()),
    ])
  })

  it('omits respondentKey from the new entry + unset list when the legacy pair had none', () => {
    const doc: ArticleWithQaDoc = {
      _id: 'needs-migration-no-key',
      body: [
        {
          _type: 'qaBlock',
          _key: 'qb-1',
          pairs: [
            {
              _key: 'p-1',
              question: 'Q?',
              answer: SAMPLE_ANSWER,
              tag: 'standard',
            },
          ],
        },
      ],
    }
    const patches = migrateQaPairRespondents(doc, stableKey)
    expect(patches).toEqual([
      at(
        'body[_key=="qb-1"].pairs[_key=="p-1"].respondents',
        set([
          {
            _type: 'qaPairRespondent',
            _key: 'fixed-key',
            answer: SAMPLE_ANSWER,
          },
        ]),
      ),
      at('body[_key=="qb-1"].pairs[_key=="p-1"].answer', unset()),
    ])
  })

  it('emits patches for multiple qaBlocks in the same article', () => {
    const doc: ArticleWithQaDoc = {
      _id: 'two-blocks',
      body: [
        {
          _type: 'qaBlock',
          _key: 'qb-1',
          pairs: [
            {_key: 'p-1', question: 'Q1?', answer: SAMPLE_ANSWER, respondentKey: 'a'},
          ],
        },
        {_type: 'block', _key: 'para', children: []},
        {
          _type: 'qaBlock',
          _key: 'qb-2',
          pairs: [
            {_key: 'p-2', question: 'Q2?', answer: SAMPLE_ANSWER, respondentKey: 'b'},
          ],
        },
      ],
    }
    const patches = migrateQaPairRespondents(doc, stableKey)
    expect(patches?.length).toBe(6) // 3 patches per pair × 2 pairs
    // Spot-check: paths reference each block's key.
    const paths = patches?.map((p) => JSON.stringify(p))
    expect(paths?.some((s) => s.includes('qb-1'))).toBe(true)
    expect(paths?.some((s) => s.includes('qb-2'))).toBe(true)
  })

  it('skips pairs with empty/missing answers (schema will flag on next edit)', () => {
    const doc: ArticleWithQaDoc = {
      _id: 'empty-answer',
      body: [
        {
          _type: 'qaBlock',
          _key: 'qb-1',
          pairs: [
            {_key: 'p-1', question: 'Q?', answer: [], respondentKey: 'a'},
            {_key: 'p-2', question: 'Q?', respondentKey: 'a'},
          ],
        },
      ],
    }
    expect(migrateQaPairRespondents(doc, stableKey)).toBeUndefined()
  })

  it('returns undefined when body is explicitly null', () => {
    expect(
      migrateQaPairRespondents(
        {_id: 'null-body', body: null} as unknown as ArticleWithQaDoc,
        stableKey,
      ),
    ).toBeUndefined()
  })

  it('skips qaBlocks that are missing their _key', () => {
    const doc: ArticleWithQaDoc = {
      _id: 'block-without-key',
      body: [
        {
          _type: 'qaBlock',
          // _key intentionally missing — can't construct a stable patch path
          pairs: [{_key: 'p-1', question: 'Q?', answer: SAMPLE_ANSWER}],
        } as {_type: 'qaBlock'; pairs: unknown},
      ],
    }
    expect(migrateQaPairRespondents(doc, stableKey)).toBeUndefined()
  })

  it('skips qaPairs that are missing their _key', () => {
    const doc: ArticleWithQaDoc = {
      _id: 'pair-without-key',
      body: [
        {
          _type: 'qaBlock',
          _key: 'qb-1',
          pairs: [
            // _key intentionally missing on the pair — can't construct
            // a stable patch path for an individual pair, so skip.
            {question: 'Q?', answer: SAMPLE_ANSWER, respondentKey: 'a'},
          ],
        },
      ],
    }
    expect(migrateQaPairRespondents(doc, stableKey)).toBeUndefined()
  })

  it('preserves mixed-state pairs (populated respondents + lingering legacy fields)', () => {
    // PRD §11 documented edge case: a pair with BOTH a populated
    // respondents[] AND stale answer/respondentKey is treated as
    // already-migrated. Orphan legacy fields stay (no patch emitted)
    // — they don't render and the document remains valid.
    const doc: ArticleWithQaDoc = {
      _id: 'mixed-state',
      body: [
        {
          _type: 'qaBlock',
          _key: 'qb-1',
          pairs: [
            {
              _key: 'p-1',
              question: 'Q?',
              respondents: [
                {
                  _type: 'qaPairRespondent',
                  _key: 'r-1',
                  respondentKey: 'subj-a',
                  answer: SAMPLE_ANSWER,
                },
              ],
              // Orphan legacy fields — should NOT be touched.
              answer: SAMPLE_ANSWER,
              respondentKey: 'subj-legacy',
            },
          ],
        },
      ],
    }
    expect(migrateQaPairRespondents(doc, stableKey)).toBeUndefined()
  })
})
