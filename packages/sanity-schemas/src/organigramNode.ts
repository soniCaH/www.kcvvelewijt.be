import {defineField, defineType} from 'sanity'
import {organigramNodePreviewSelect, prepareOrganigramNodePreview} from './preview/organigramNode-preview'
import {validateOrganigramMember} from './validation/organigram-members'

export const organigramNode = defineType({
  name: 'organigramNode',
  title: 'Organigram node',
  type: 'document',
  // Editor-UX rework groups (#2181). `rol` is the default tab.
  groups: [
    {name: 'rol', title: 'Rol', default: true},
    {name: 'hierarchie', title: 'Hiërarchie'},
    {name: 'personen', title: 'Personen'},
    {name: 'meta', title: 'Meta'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Functietitel',
      type: 'string',
      group: 'rol',
      description:
        'De naam van de positie in het organigram (bijv. "Voorzitter" of "Technisch Coördinator Jeugd"). Wordt als titel van de node getoond.',
      validation: (Rule) =>
        Rule.required().error('Verplicht. Zonder functietitel heeft de positie geen naam in het organigram.'),
    }),
    defineField({
      name: 'description',
      title: 'Beschrijving',
      type: 'text',
      rows: 3,
      group: 'rol',
      description:
        'Korte beschrijving van de positie of taken. Getoond in het detail-venster wanneer een bezoeker op de node klikt.',
    }),
    defineField({
      name: 'roleCode',
      title: 'Korte functiecode',
      type: 'string',
      group: 'rol',
      description:
        'Korte badge in het diagram (bijv. "T1", "VP", "JC"), max. 6 tekens. Optioneel — laat leeg voor geen badge.',
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: 'department',
      title: 'Afdeling',
      type: 'string',
      group: 'hierarchie',
      description: 'De afdeling waaronder deze positie valt. Bepaalt de groepering van de node in het organigram.',
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
      group: 'hierarchie',
      description:
        'De hiërarchisch bovenliggende positie. Laat leeg voor een positie op het hoogste niveau (rootniveau).',
    }),
    defineField({
      name: 'members',
      title: 'Leden',
      type: 'array',
      group: 'personen',
      of: [
        {
          type: 'reference',
          to: [{type: 'staffMember'}],
          validation: (Rule) =>
            Rule.custom((ref, context) => validateOrganigramMember(ref as never, context)),
        },
      ],
      description:
        'De staffleden die deze positie bekleden. Meerdere leden = gedeelde positie; geen leden = vacante positie. Het gekoppelde lid wordt als contactpersoon getoond waar de positie hergebruikt wordt.',
    }),
    defineField({
      name: 'active',
      title: 'Actief',
      type: 'boolean',
      group: 'meta',
      initialValue: true,
      description: 'Zet uit om deze positie tijdelijk uit het organigram te verbergen zonder ze te verwijderen.',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sortering',
      type: 'number',
      group: 'meta',
      description: 'Handmatige volgorde binnen eenzelfde niveau — lagere waarden verschijnen eerst.',
    }),
  ],
  preview: {
    select: organigramNodePreviewSelect,
    prepare: prepareOrganigramNodePreview,
  },
})
