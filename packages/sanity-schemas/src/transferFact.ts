import {defineField, defineType} from 'sanity'

/**
 * Design §4.4 — `transferFact` is a body block for `articleType='transfer'`
 * documents. Editors describe a single transfer move (direction, player,
 * other club, optional note); the renderer composes from/to rows. The
 * KCVV side is **never** entered by the editor: direction determines
 * which row is auto-rendered as KCVV, and the front-end supplies the
 * logo + club name.
 *
 * `otherClubName` / `otherClubLogo` are hidden for `extension` (the move
 * is KCVV → KCVV, so there is no counterparty). `until` is the inverse.
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
          {title: 'Incoming — other → KCVV', value: 'incoming'},
          {title: 'Outgoing — KCVV → other', value: 'outgoing'},
          {title: 'Extension — stays at KCVV', value: 'extension'},
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
      name: 'playerPhoto',
      title: 'Player photo',
      type: 'image',
      description:
        'Transparent cutout or portrait. Rendered object-contain, bottom-aligned in the feature variant (first transferFact in the body) — use transparent PNGs for the cleanest result. Overview cards do not show this image.',
      // Hotspot kept on the schema so editors can tweak framing if a
      // later GROQ projection adds a focalpoint crop. The current
      // projection uses `fit=max`, which ignores the hotspot.
      options: {hotspot: true},
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
      name: 'until',
      title: 'Until (extension only)',
      type: 'string',
      description:
        'Display string, e.g. "2028" or "tot einde seizoen 2027-28". Shown only on extensions.',
      hidden: ({parent}) => parent?.direction !== 'extension',
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'text',
      rows: 2,
      validation: (r) => r.max(140),
      description: 'Optional colour line (max 140 chars).',
    }),
  ],
  preview: {
    select: {
      playerName: 'playerName',
      direction: 'direction',
      otherClubName: 'otherClubName',
      until: 'until',
      media: 'playerPhoto',
    },
    prepare({playerName, direction, otherClubName, until, media}) {
      const who = playerName ?? 'Transfer fact'
      const tail =
        direction === 'extension'
          ? `verlengd${until ? ` tot ${until}` : ''}`
          : direction === 'outgoing'
            ? `→ ${otherClubName ?? 'onbekend'}`
            : direction === 'incoming'
              ? `← ${otherClubName ?? 'onbekend'}`
              : '—'
      return {
        title: who,
        subtitle: `${direction ?? 'no direction'} · ${tail}`,
        media,
      }
    },
  },
})
