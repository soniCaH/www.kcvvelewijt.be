import {defineField, defineType} from 'sanity'

/**
 * Design §4.5 / §8.2 — `eventFact` is a body block for `articleType='event'`
 * documents. The first eventFact in the body powers the horizontal
 * `EventStrip` beneath the §7.6 metadata bar (serif-style date block left
 * + title / metadata / note / CTA right). Subsequent eventFacts render as
 * compact overview rows on the dark band stack, matching the transfer
 * overview treatment.
 *
 * The hero itself stays typographic (kicker + title only) — the date
 * block lives in the strip, not the hero, to avoid duplicating the date
 * on the page. Mirrors the Phase 5 (transfer) hero/strip split.
 */
export const eventFact = defineType({
  name: 'eventFact',
  title: 'Event fact',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'startTime',
      title: 'Start time',
      type: 'string',
      description: 'HH:mm (e.g. "10:00")',
    }),
    defineField({
      name: 'endTime',
      title: 'End time',
      type: 'string',
      description: 'HH:mm (e.g. "17:00")',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'Short venue name, e.g. "Sportpark Elewijt".',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'string',
      description: 'Street + town, e.g. "Driesstraat 14, Elewijt".',
    }),
    defineField({
      name: 'ageGroup',
      title: 'Age group',
      type: 'string',
      description:
        'Free text, e.g. "U13", "Senioren", "Alle jeugd". Drives the hero kicker when present.',
    }),
    defineField({
      name: 'competitionTag',
      title: 'Competition tag',
      type: 'string',
      description:
        'Free text, e.g. "Tornooi", "Clubfeest", "Training". Fallback for the hero kicker when `ageGroup` is empty.',
    }),
    defineField({
      name: 'ticketUrl',
      title: 'Ticket URL',
      type: 'url',
      description:
        'Optional. When set, the strip + overview rows render a CTA link. When absent, the CTA is hidden.',
    }),
    defineField({
      name: 'ticketLabel',
      title: 'Ticket CTA label',
      type: 'string',
      description: 'Free text, defaults to "Inschrijven" when empty.',
      initialValue: 'Inschrijven',
    }),
    defineField({
      name: 'capacity',
      title: 'Capacity',
      type: 'number',
      description: 'Optional. Displayed only when set (e.g. "Max 24 spelers").',
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'array',
      of: [{type: 'block', styles: [{title: 'Normal', value: 'normal'}], lists: []}],
      description: 'Optional short prose — one or two paragraphs of context.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'date',
      location: 'location',
      ageGroup: 'ageGroup',
    },
    prepare({title, date, location, ageGroup}) {
      const who = title ?? 'Event fact'
      const parts = [date, ageGroup, location].filter(
        (x): x is string => typeof x === 'string' && x.length > 0,
      )
      return {
        title: who,
        subtitle: parts.length > 0 ? parts.join(' · ') : 'no date',
      }
    },
  },
})
