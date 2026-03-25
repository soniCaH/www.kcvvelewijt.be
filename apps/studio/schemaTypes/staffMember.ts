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
          // Coaching staff
          {title: 'Hoofdtrainer', value: 'hoofdtrainer'},
          {title: 'Assistent-trainer', value: 'assistent'},
          {title: 'Keeperstrainer', value: 'keeperstrainer'},
          {title: 'TVJO', value: 'tvjo'},
          {title: 'Ploegdelegatie', value: 'ploegdelegatie'},
          {title: 'Afgevaardigde', value: 'afgevaardigde'},
          {title: 'Coach', value: 'coach'},
          // Board / admin
          {title: 'Voorzitter', value: 'voorzitter'},
          {title: 'Ondervoorzitter', value: 'ondervoorzitter'},
          {title: 'Secretaris', value: 'secretaris'},
          {title: 'Penningmeester', value: 'penningmeester'},
          {title: 'Jeugdcoördinator', value: 'jeugdcoordinator'},
          {title: 'Jeugdsecretaris', value: 'jeugdsecretaris'},
          {title: 'Technisch coördinator', value: 'technisch-coordinator'},
          {title: 'Sportief verantwoordelijke', value: 'sportief-verantwoordelijke'},
          {title: 'Verantwoordelijke sponsoring', value: 'sponsoring-verantwoordelijke'},
          {title: 'Verzekeringverantwoordelijke', value: 'verzekering-verantwoordelijke'},
          {title: 'Evenementencoördinator', value: 'evenementen-coordinator'},
          {title: 'PR-verantwoordelijke', value: 'pr-verantwoordelijke'},
          {title: 'Kantineverantwoordelijke', value: 'kantine-verantwoordelijke'},
          {title: 'Webmaster', value: 'webmaster'},
          {title: 'Bestuur', value: 'bestuur'},
          {title: 'Andere', value: 'other'},
        ],
      },
    }),
    defineField({
      name: 'department',
      title: 'Department',
      type: 'string',
      options: {
        list: [
          {title: 'Hoofdbestuur', value: 'hoofdbestuur'},
          {title: 'Jeugdbestuur', value: 'jeugdbestuur'},
          {title: 'Algemeen', value: 'algemeen'},
        ],
      },
    }),
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
      name: 'inOrganigram',
      title: 'In organigram',
      type: 'boolean',
      initialValue: false,
      description: 'Zet aan om deze persoon in het organigram te tonen. Laat uit voor inactieve of onvolledige leden.',
    }),
    defineField({
      name: 'parentMember',
      title: 'Rapporteert aan',
      type: 'reference',
      to: [{type: 'staffMember'}],
      weak: true,
      description: 'Hiërarchisch bovenliggende persoon. Leeg = rootniveau (rechtstreeks onder KCVV Elewijt).',
      hidden: ({document}) => !document?.inOrganigram,
      options: {
        filter: ({document}) => ({
          filter: 'inOrganigram == true && _id != $selfId',
          params: {selfId: document._id as string},
        }),
      },
    }),
    defineField({
      name: 'positionTitle',
      title: 'Functietitel (organigram)',
      type: 'string',
      description:
        'Vrije tekst zoals getoond in het organigram, bv. "Technisch Coördinator Jeugd". Mag afwijken van het Rol-veld.',
      hidden: ({document}) => !document?.inOrganigram,
    }),
    defineField({
      name: 'positionShort',
      title: 'Korte functiecode',
      type: 'string',
      description: 'Badge in het diagram, bv. "T1", "VP", "JC". Max 6 tekens. Gesynchroniseerd vanuit PSD voor trainers.',
      validation: (Rule) => Rule.max(6),
      hidden: ({document}) => !document?.inOrganigram,
    }),
    defineField({
      name: 'responsibilities',
      title: 'Verantwoordelijkheden',
      type: 'text',
      rows: 3,
      description: 'Korte beschrijving van taken en verantwoordelijkheden. Getoond in het detail-venster van het organigram.',
      hidden: ({document}) => !document?.inOrganigram,
    }),
    defineField({
      name: 'psdId',
      title: 'PSD ID',
      type: 'string',
      description:
        'Set by PSD sync (GET /teams/{id}/staff). When synced, role is mapped from PSD functionTitle (free-text, e.g. "Keeperstrainer", "T2").',
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
