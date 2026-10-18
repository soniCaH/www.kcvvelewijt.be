import {at, set} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {
  migrateRenameKantineVerhuurStep,
  type KantineVerhuurResponsibilityDoc,
} from './rename-kantine-verhuur-step'

const doc = (over: Partial<KantineVerhuurResponsibilityDoc>): KantineVerhuurResponsibilityDoc => ({
  _id: 'r-1',
  _type: 'responsibility',
  title: 'Terrein of kantine huren',
  ...over,
})

describe('migrateRenameKantineVerhuurStep', () => {
  it('rewrites the old box name in the step text of the huren question', () => {
    const patches = migrateRenameKantineVerhuurStep(
      doc({
        steps: [
          {_key: 'a', description: 'Neem contact op met Kantine & Evenementen'},
          {_key: 'b', description: 'Vraag de prijzen op'},
        ],
      }),
    )
    expect(patches).toEqual([
      at('steps[_key=="a"].description', set('Neem contact op met Kantineverhuur')),
    ])
  })

  it('leaves other responsibilities alone', () => {
    expect(
      migrateRenameKantineVerhuurStep(
        doc({title: 'Evenement organiseren', steps: [{_key: 'a', description: 'Kantine & Evenementen'}]}),
      ),
    ).toBeUndefined()
  })

  it('is idempotent once the text is renamed', () => {
    expect(
      migrateRenameKantineVerhuurStep(doc({steps: [{_key: 'a', description: 'Neem contact op met Kantineverhuur'}]})),
    ).toBeUndefined()
  })

  it('skips steps without a key or a description', () => {
    expect(
      migrateRenameKantineVerhuurStep(doc({steps: [{description: 'Kantine & Evenementen'}, {_key: 'x'}]})),
    ).toBeUndefined()
    expect(migrateRenameKantineVerhuurStep(doc({}))).toBeUndefined()
  })
})
