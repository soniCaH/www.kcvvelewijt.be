import {defineField, defineType} from 'sanity'
import {organigramNodePreviewSelect, prepareOrganigramNodePreview} from './preview/organigramNode-preview'
import {validateOrganigramMember} from './validation/organigram-members'

export const organigramNode = defineType({
  name: 'organigramNode',
  title: 'Organigram node',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Functietitel',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'De naam van de positie in het organigram, bv. "Voorzitter" of "Technisch Coördinator Jeugd".',
    }),
    defineField({
      name: 'description',
      title: 'Beschrijving',
      type: 'text',
      rows: 3,
      description: 'Korte beschrijving van de positie of taken. Getoond in het detail-venster van het organigram.',
    }),
    defineField({
      name: 'roleCode',
      title: 'Korte functiecode',
      type: 'string',
      description: 'Badge in het diagram, bv. "T1", "VP", "JC". Max 6 tekens.',
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: 'department',
      title: 'Afdeling',
      type: 'string',
      options: {
        list: [
          {title: 'Hoofdbestuur', value: 'hoofdbestuur'},
          {title: 'Jeugdbestuur', value: 'jeugdbestuur'},
          {title: 'Algemeen', value: 'algemeen'},
        ],
      },
    }),
    defineField({
      name: 'parentNode',
      title: 'Rapporteert aan',
      type: 'reference',
      to: [{type: 'organigramNode'}],
      weak: true,
      description: 'Hiërarchisch bovenliggend knooppunt. Leeg = rootniveau.',
    }),
    defineField({
      name: 'members',
      title: 'Leden',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'staffMember'}],
          validation: (Rule) =>
            Rule.custom((ref, context) => validateOrganigramMember(ref as never, context)),
        },
      ],
      description:
        'Staffleden die deze positie bekleden. Meerdere leden = gedeelde positie; geen leden = vacante positie.',
    }),
    defineField({
      name: 'active',
      title: 'Actief',
      type: 'boolean',
      initialValue: true,
      description: 'Zet uit om deze node te verbergen in het organigram.',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sortering',
      type: 'number',
      description: 'Handmatige volgorde voor weergave in het organigram. Lagere waarden worden eerst getoond.',
    }),
  ],
  preview: {
    select: organigramNodePreviewSelect,
    prepare: prepareOrganigramNodePreview,
  },
})
