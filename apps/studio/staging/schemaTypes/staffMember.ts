import {defineField, defineType} from 'sanity'

export const staffMember = defineType({
  name: 'staffMember',
  title: 'Staff member',
  type: 'document',
  fields: [
    defineField({name: 'firstName', title: 'First name', type: 'string'}),
    defineField({name: 'lastName', title: 'Last name', type: 'string'}),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          {title: 'Hoofdtrainer', value: 'hoofdtrainer'},
          {title: 'Assistent-trainer', value: 'assistent'},
          {title: 'Keeperstrainer', value: 'keeperstrainer'},
          {title: 'TVJO', value: 'tvjo'},
          {title: 'Ploegdelegatie', value: 'ploegdelegatie'},
          {title: 'Afgevaardigde', value: 'afgevaardigde'},
          {title: 'Coach', value: 'coach'},
          {title: 'Bestuur', value: 'bestuur'},
          {title: 'Andere', value: 'other'},
        ],
      },
    }),
    defineField({name: 'birthDate', title: 'Birth date', type: 'date'}),
    defineField({name: 'joinDate', title: 'Join date', type: 'date'}),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'psdId',
      title: 'PSD ID',
      type: 'string',
      description:
        'Set by PSD sync (GET /teams/{id}/staff). When synced, role is mapped from PSD functionTitle (free-text, e.g. "Keeperstrainer", "T2").',
    }),
  ],
  preview: {
    select: {
      firstName: 'firstName',
      lastName: 'lastName',
      role: 'role',
      media: 'photo',
    },
    prepare({firstName, lastName, role, media}) {
      return {
        title: `${firstName ?? ''} ${lastName ?? ''}`.trim(),
        subtitle: role,
        media,
      }
    },
  },
})
