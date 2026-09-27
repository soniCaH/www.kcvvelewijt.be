import {describe, expect, it} from 'vitest'
import {auditFactBlocks} from './audit-fact-blocks'

describe('auditFactBlocks', () => {
  it('ignores article types that need no fact block', () => {
    expect(auditFactBlocks({articleType: 'announcement', body: []})).toBeUndefined()
    expect(auditFactBlocks({})).toBeUndefined()
  })

  it('passes an event article that carries an eventFact', () => {
    expect(
      auditFactBlocks({
        articleType: 'event',
        body: [{_type: 'block'}, {_type: 'eventFact'}],
      }),
    ).toBeUndefined()
  })

  it('reports an event article without an eventFact', () => {
    expect(
      auditFactBlocks({
        articleType: 'event',
        body: [{_type: 'transferFact'}],
        title: 'BBQ',
        slug: {current: 'bbq'},
      }),
    ).toBe('[event missing eventFact] bbq — "BBQ"')
  })

  it('reports a transfer article with no body at all', () => {
    expect(
      auditFactBlocks({
        articleType: 'transfer',
        title: [{children: [{text: 'Nieuwe spits'}]}],
        slug: {current: 'spits'},
      }),
    ).toBe('[transfer missing transferFact] spits — "Nieuwe spits"')
  })
})
