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
      title: 'Start date',
      type: 'date',
      description: 'Calendar day the event starts.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'End date',
      type: 'date',
      description:
        'Optional. Fill only for multi-day events (weekend tornooi, school-holiday camp). Must be on or after the start date.',
      validation: (r) =>
        r.custom((value, ctx) => {
          if (typeof value !== 'string' || value.length === 0) return true
          const parent = ctx.parent as {date?: string} | undefined
          const start = parent?.date
          if (typeof start !== 'string' || start.length === 0) return true
          return value >= start
            ? true
            : 'End date must be on or after the start date.'
        }),
    }),
    defineField({
      name: 'startTime',
      title: 'Start time',
      type: 'string',
      description:
        'HH:mm (e.g. "10:00"). Use for simple single-day or continuous multi-day events. Leave empty when `sessions` (per-day schedule) is filled.',
    }),
    defineField({
      name: 'endTime',
      title: 'End time',
      type: 'string',
      description:
        'HH:mm (e.g. "17:00"). Use for simple single-day or continuous multi-day events. Leave empty when `sessions` (per-day schedule) is filled.',
    }),
    defineField({
      name: 'sessions',
      title: 'Per-day schedule (recurring events)',
      description:
        'Use for recurring events where each day has its own hours (e.g. a steakfestijn: vrijdag 18:00–22:00, zaterdag 17:00–23:00, zondag 11:30–15:00). Leave empty for single-day or continuous multi-day events — the top-level date/time fields handle those.',
      type: 'array',
      of: [
        defineField({
          name: 'session',
          type: 'object',
          fields: [
            defineField({
              name: 'date',
              type: 'date',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'startTime',
              type: 'string',
              description: 'HH:mm',
            }),
            defineField({
              name: 'endTime',
              type: 'string',
              description: 'HH:mm',
            }),
          ],
          preview: {
            select: {
              date: 'date',
              startTime: 'startTime',
              endTime: 'endTime',
            },
            prepare({date, startTime, endTime}) {
              const range = [startTime, endTime].filter(Boolean).join(' – ')
              return {
                title: date ?? 'Sessie',
                subtitle: range || 'geen tijden ingevuld',
              }
            },
          },
        }),
      ],
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
