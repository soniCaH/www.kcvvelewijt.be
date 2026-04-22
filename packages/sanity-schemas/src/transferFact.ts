import {defineField, defineType} from 'sanity'

/**
 * Design §4.4 — `transferFact` is a body block for `articleType='transfer'`
 * documents. Editors describe a single transfer move (direction, player,
 * other club, optional context/note); the renderer composes from/to rows.
 * The KCVV side is **never** entered by the editor: direction determines
 * which row is auto-rendered as KCVV, and the front-end supplies the
 * logo + club name.
 *
 * `otherClubName` / `otherClubLogo` / `otherClubContext` are hidden for
 * `extension` (the move is KCVV → KCVV, so there is no counterparty).
 * `until` is the inverse.
 *
 * Layout notes:
 *   - The **first** transferFact in the body powers the hero (player name,
 *     meta, pull-quote) and the horizontal van → naar strip beneath the
 *     metadata bar. Editors fill it like any other transferFact; the
 *     template handles the promotion automatically.
 *   - Every subsequent transferFact renders as a compact overview row,
 *     typically beneath an editor-authored `Ander transfernieuws` heading.
 */
export const transferFact = defineType({
  name: 'transferFact',
  title: 'Transfer fact',
  type: 'object',
  fields: [
    defineField({
      name: 'direction',
      title: 'Direction',
      type: 'string',
      options: {
        list: [
          {title: 'Inkomend — other → KCVV', value: 'incoming'},
          {title: 'Uitgaand — KCVV → other', value: 'outgoing'},
          {title: 'Verlengd — stays at KCVV', value: 'extension'},
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'playerName',
      title: 'Player name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'position',
      title: 'Position',
      type: 'string',
      options: {
        list: ['Keeper', 'Verdediger', 'Middenvelder', 'Aanvaller'],
      },
    }),
    defineField({
      name: 'age',
      title: 'Age',
      type: 'number',
      validation: (r) => r.min(14).max(45),
    }),
    defineField({
      name: 'otherClubName',
      title: 'Other club name',
      type: 'string',
      description: 'Required for incoming/outgoing; leave empty for extension.',
      hidden: ({parent}) => parent?.direction === 'extension',
    }),
    defineField({
      name: 'otherClubLogo',
      title: 'Other club logo',
      type: 'image',
      hidden: ({parent}) => parent?.direction === 'extension',
    }),
    defineField({
      name: 'otherClubContext',
      title: 'Other club context',
      type: 'string',
      description:
        'Short free-text context rendered beneath the other club name on the van/naar strip — e.g. "Jupiler Pro League · U23".',
      hidden: ({parent}) => parent?.direction === 'extension',
    }),
    defineField({
      name: 'kcvvContext',
      title: 'KCVV context',
      type: 'string',
      description:
        'Short free-text context rendered beneath the KCVV row — e.g. "Derde Amateur · A-ploeg · #8". Used by the hero strip; overview rows stay compact.',
    }),
    defineField({
      name: 'until',
      title: 'Until (extension only)',
      type: 'string',
      description:
        'Display string for extensions, e.g. "2028" or "einde seizoen 2027-28". Shown only on extensions.',
      hidden: ({parent}) => parent?.direction !== 'extension',
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'text',
      rows: 2,
      validation: (r) => r.max(140),
      description:
        'Optional colour line rendered as a pull-quote in the hero (first transferFact only). Max 140 chars.',
    }),
    defineField({
      name: 'noteAttribution',
      title: 'Note attribution',
      type: 'string',
      description:
        'Optional override for the pull-quote byline (e.g. a coach or board quote). Defaults to `playerName` when empty.',
    }),
  ],
  preview: {
    select: {
      playerName: 'playerName',
      direction: 'direction',
      otherClubName: 'otherClubName',
      until: 'until',
    },
    prepare({playerName, direction, otherClubName, until}) {
      const who = playerName ?? 'Transfer fact'
      let tail = '—'
      switch (direction) {
        case 'extension':
          tail = `verlengd${until ? ` tot ${until}` : ''}`
          break
        case 'outgoing':
          tail = `→ ${otherClubName ?? 'onbekend'}`
          break
        case 'incoming':
          tail = `← ${otherClubName ?? 'onbekend'}`
          break
      }
      return {
        title: who,
        subtitle: `${direction ?? 'no direction'} · ${tail}`,
      }
    },
  },
})
