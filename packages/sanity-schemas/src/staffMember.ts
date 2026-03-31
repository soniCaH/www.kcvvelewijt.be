import {defineField, defineType} from 'sanity'

export const staffMember = defineType({
  name: 'staffMember',
  title: 'Staff member',
  type: 'document',
  fields: [
    defineField({name: 'firstName', title: 'First name', type: 'string'}),
    defineField({name: 'lastName', title: 'Last name', type: 'string'}),
    defineField({name: 'email', title: 'Email', type: 'string'}),
    defineField({name: 'phone', title: 'Phone', type: 'string'}),
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
      description: 'Set by PSD sync (GET /teams/{id}/staff). Unique identifier used as the public slug. Read-only — managed by sync only.',
      readOnly: true,
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      description:
        'Set automatically by sync when member is no longer in PSD. Do not edit manually.',
      readOnly: true,
      hidden: true,
    }),
  ],
  preview: {
    select: {
      firstName: 'firstName',
      lastName: 'lastName',
      media: 'photo',
    },
    prepare({firstName, lastName, media}) {
      return {
        title: `${firstName ?? ''} ${lastName ?? ''}`.trim(),
        media,
      }
    },
  },
})
