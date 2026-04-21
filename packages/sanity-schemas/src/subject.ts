import {defineField, defineType} from 'sanity'

/**
 * Discriminated union describing the person attributed to an interview
 * (`article.subject`). Used by the `key` and `quote` qaBlock treatments and
 * the Phase 3 interview hero. Sanity Studio conditionally shows only the
 * branch fields matching the selected `kind`.
 */
export const subject = defineType({
  name: 'subject',
  title: 'Subject',
  type: 'object',
  fields: [
    defineField({
      name: 'kind',
      title: 'Subject kind',
      type: 'string',
      options: {
        list: [
          {title: 'KCVV Player', value: 'player'},
          {title: 'Staff member', value: 'staff'},
          {title: 'Custom (not in squad)', value: 'custom'},
        ],
        layout: 'radio',
      },
      initialValue: 'player',
      validation: (r) => r.required(),
    }),

    defineField({
      name: 'playerRef',
      title: 'Player',
      type: 'reference',
      to: [{type: 'player'}],
      hidden: ({parent}) => parent?.kind !== 'player',
      validation: (r) =>
        r.custom((val, ctx) => {
          const parent = ctx.parent as {kind?: string} | undefined
          return parent?.kind === 'player' && !val ? 'Required' : true
        }),
    }),

    defineField({
      name: 'staffRef',
      title: 'Staff member',
      type: 'reference',
      to: [{type: 'staffMember'}],
      hidden: ({parent}) => parent?.kind !== 'staff',
      validation: (r) =>
        r.custom((val, ctx) => {
          const parent = ctx.parent as {kind?: string} | undefined
          return parent?.kind === 'staff' && !val ? 'Required' : true
        }),
    }),

    defineField({
      name: 'customName',
      title: 'Name',
      type: 'string',
      hidden: ({parent}) => parent?.kind !== 'custom',
      validation: (r) =>
        r.custom((val, ctx) => {
          const parent = ctx.parent as {kind?: string} | undefined
          return parent?.kind === 'custom' && !val ? 'Required' : true
        }),
    }),
    defineField({
      name: 'customPhoto',
      title: 'Photo',
      type: 'image',
      options: {hotspot: true},
      hidden: ({parent}) => parent?.kind !== 'custom',
      validation: (r) =>
        r.custom((val, ctx) => {
          const parent = ctx.parent as {kind?: string} | undefined
          return parent?.kind === 'custom' && !val
            ? 'A photo is required for custom subjects — QaPairKey renders a portrait column that would otherwise be empty.'
            : true
        }),
    }),
    defineField({
      name: 'customRole',
      title: 'Role',
      type: 'string',
      description: 'E.g. "Trainer tegenstander", "Supporter", "Oud-speler"',
      hidden: ({parent}) => parent?.kind !== 'custom',
    }),
  ],
  preview: {
    select: {
      kind: 'kind',
      playerFirst: 'playerRef.firstName',
      playerLast: 'playerRef.lastName',
      playerPhoto: 'playerRef.transparentImage',
      playerPsdPhoto: 'playerRef.psdImage',
      staffFirst: 'staffRef.firstName',
      staffLast: 'staffRef.lastName',
      staffPhoto: 'staffRef.photo',
      customName: 'customName',
      customPhoto: 'customPhoto',
    },
    prepare({
      kind,
      playerFirst,
      playerLast,
      playerPhoto,
      playerPsdPhoto,
      staffFirst,
      staffLast,
      staffPhoto,
      customName,
      customPhoto,
    }) {
      if (!kind) {
        return {
          title: 'Subject (kind not set)',
          subtitle: 'Subject — unknown',
        }
      }
      if (kind === 'player') {
        const name = [playerFirst, playerLast].filter(Boolean).join(' ')
        return {
          title: name || 'Player (reference unresolved)',
          subtitle: 'Subject — player',
          media: playerPhoto ?? playerPsdPhoto,
        }
      }
      if (kind === 'staff') {
        const name = [staffFirst, staffLast].filter(Boolean).join(' ')
        return {
          title: name || 'Staff (reference unresolved)',
          subtitle: 'Subject — staff',
          media: staffPhoto,
        }
      }
      if (kind === 'custom') {
        return {
          title: customName || 'Custom subject (no name)',
          subtitle: 'Subject — custom',
          media: customPhoto,
        }
      }
      return {
        title: 'Subject (unknown kind)',
        subtitle: `Subject — ${kind}`,
      }
    },
  },
})
