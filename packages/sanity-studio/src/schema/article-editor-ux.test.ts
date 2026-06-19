import {describe, expect, it} from 'vitest'

import {article} from '@kcvv/sanity-schemas'

// Guards the editor-UX rework convention (#1501) on the article doc type:
// four field groups, every field grouped, every field teaching-described.
const EXPECTED_GROUPS = ['type', 'inhoud', 'publicatie', 'gerelateerd']

type FieldShape = {name: string; group?: unknown; description?: unknown}
type GroupShape = {name: string; default?: boolean}

const groups = (article.groups ?? []) as GroupShape[]
const fields = (article.fields ?? []) as FieldShape[]

describe('article editor-UX rework (#1501)', () => {
  it('declares the four rework groups in order', () => {
    expect(groups.map((g) => g.name)).toEqual(EXPECTED_GROUPS)
  })

  it('marks exactly one group as the default', () => {
    expect(groups.filter((g) => g.default === true)).toHaveLength(1)
  })

  it('assigns every field to one of the rework groups', () => {
    for (const f of fields) {
      expect(EXPECTED_GROUPS, `field "${f.name}" group`).toContain(f.group)
    }
  })

  it('gives every field a non-empty teaching description', () => {
    for (const f of fields) {
      expect(typeof f.description, `field "${f.name}" description type`).toBe('string')
      expect((f.description as string).trim().length, `field "${f.name}" description`).toBeGreaterThan(0)
    }
  })
})
