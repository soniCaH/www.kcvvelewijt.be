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
      name: 'eventType',
      title: 'Event type',
      type: 'string',
      description:
        'Categorie van het evenement — bepaalt de kleurcode in de /evenementen-agenda wanneer dit event-artikel in de feed verschijnt. Laat leeg voor "Andere".',
      options: {
        list: [
          {title: 'Clubevent', value: 'Clubevent'},
          {title: 'Supportersactiviteit', value: 'Supportersactiviteit'},
          {title: 'Jeugdwerking', value: 'Jeugdwerking'},
          {title: 'Andere', value: 'Andere'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'date',
      title: 'Start date',
      type: 'date',
      description: 'De kalenderdag waarop het evenement start.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'End date',
      type: 'date',
      description:
        'Optioneel. Enkel invullen voor meerdaagse evenementen (weekendtornooi, vakantiekamp). Moet op of na de startdatum vallen.',
      validation: (r) =>
        r.custom((value, ctx) => {
          if (typeof value !== 'string' || value.length === 0) return true
          const parent = ctx.parent as {date?: string} | undefined
          const start = parent?.date
          if (typeof start !== 'string' || start.length === 0) return true
          return value >= start
            ? true
            : 'De einddatum moet op of na de startdatum vallen.'
        }),
    }),
    defineField({
      name: 'startTime',
      title: 'Start time',
      type: 'string',
      description:
        'UU:mm (bijv. "10:00"). Gebruik voor eenvoudige eendaagse of doorlopende meerdaagse evenementen. Laat leeg wanneer `sessions` (dagschema) is ingevuld.',
    }),
    defineField({
      name: 'endTime',
      title: 'End time',
      type: 'string',
      description:
        'UU:mm (bijv. "17:00"). Gebruik voor eenvoudige eendaagse of doorlopende meerdaagse evenementen. Laat leeg wanneer `sessions` (dagschema) is ingevuld.',
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
              description: 'UU:mm',
            }),
            defineField({
              name: 'endTime',
              type: 'string',
              description: 'UU:mm',
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
      description: 'Korte locatienaam, bijv. "Sportpark Elewijt".',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'string',
      description: 'Straat + gemeente, bijv. "Driesstraat 14, Elewijt".',
    }),
    defineField({
      name: 'ageGroup',
      title: 'Age group',
      type: 'string',
      description:
        'Vrije tekst, bijv. "U13", "Senioren", "Alle jeugd". Bepaalt de hero-kicker indien ingevuld.',
    }),
    defineField({
      name: 'competitionTag',
      title: 'Competition tag',
      type: 'string',
      description:
        'Vrije tekst, bijv. "Tornooi", "Clubfeest", "Training". Terugval voor de hero-kicker wanneer `ageGroup` leeg is.',
    }),
    defineField({
      name: 'ticketUrl',
      title: 'Ticket URL',
      type: 'url',
      description:
        'Optioneel. Indien ingevuld tonen de strip + overzichtsrijen een CTA-link. Zonder waarde blijft de CTA verborgen.',
    }),
    defineField({
      name: 'ticketLabel',
      title: 'Ticket CTA label',
      type: 'string',
      description: 'Vrije tekst, valt terug op "Inschrijven" indien leeg.',
      initialValue: 'Inschrijven',
    }),
    defineField({
      name: 'capacity',
      title: 'Capacity',
      type: 'number',
      description: 'Optioneel. Enkel getoond indien ingevuld (bijv. "Max 24 spelers").',
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'array',
      of: [{type: 'block', styles: [{title: 'Normal', value: 'normal'}], lists: []}],
      description: 'Optionele korte tekst — één of twee alinea\'s context.',
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
