import {ConcreteRuleClass} from 'sanity'
import {describe, expect, it} from 'vitest'
import {event} from '@kcvv/sanity-schemas'

/**
 * Field-level test: runs the actual `validation` registered on `event.dateEnd`
 * through a real `ConcreteRuleClass`, so a wiring slip (rule not attached, wrong
 * `parent` key) fails here, not just a bug in the helper.
 */
const MESSAGE = 'De einddatum moet op of na de startdatum vallen.'

async function validateDateEnd(dateEnd: unknown, dateStart: unknown) {
  const field = event.fields.find((f) => f.name === 'dateEnd')
  if (!field) throw new Error('event.dateEnd field not found')
  const validation = (field as {validation?: unknown}).validation as (
    rule: InstanceType<typeof ConcreteRuleClass>,
  ) => InstanceType<typeof ConcreteRuleClass>
  const rule = validation(new ConcreteRuleClass())
  const context = {
    parent: {dateStart},
    document: {dateStart},
    i18n: {t: (key: string) => key},
    schema: {},
    type: {},
    environment: 'test',
    path: ['dateEnd'],
  }
  return rule.validate(dateEnd, context as never)
}

describe('event.dateEnd validation (rule level)', () => {
  it('rejects an end before the start with the eventFact message', async () => {
    const markers = await validateDateEnd('2026-10-19T10:00:00Z', '2026-10-20T10:00:00Z')
    expect(markers).toHaveLength(1)
    expect(markers[0].level).toBe('error')
    expect(markers[0].item?.message).toBe(MESSAGE)
  })

  it('accepts an end equal to or after the start', async () => {
    expect(await validateDateEnd('2026-10-20T10:00:00Z', '2026-10-20T10:00:00Z')).toHaveLength(0)
    expect(await validateDateEnd('2026-10-21T10:00:00Z', '2026-10-20T10:00:00Z')).toHaveLength(0)
  })

  it('passes when either value is empty or NaN', async () => {
    expect(await validateDateEnd(undefined, '2026-10-20T10:00:00Z')).toHaveLength(0)
    expect(await validateDateEnd('2026-10-19T10:00:00Z', undefined)).toHaveLength(0)
    expect(await validateDateEnd('not-a-date', '2026-10-20T10:00:00Z')).toHaveLength(0)
    expect(await validateDateEnd('2026-10-19T10:00:00Z', 'not-a-date')).toHaveLength(0)
  })

  it('compares instants across mixed +01:00 / Z offsets', async () => {
    // 22:30+01:00 is 21:30Z: before 21:45Z lexicographically too, but after it as an instant
    expect(await validateDateEnd('2026-10-20T22:50:00+01:00', '2026-10-20T21:45:00Z')).toHaveLength(0)
    // string compare says "T22" > "T21" (passes); instants say 21:10Z < 21:45Z (fails)
    const markers = await validateDateEnd('2026-10-20T22:10:00+01:00', '2026-10-20T21:45:00Z')
    expect(markers).toHaveLength(1)
  })
})
