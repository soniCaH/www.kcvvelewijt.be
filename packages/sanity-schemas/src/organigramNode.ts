import {defineField, defineType} from 'sanity'
import {organigramNodePreviewSelect, prepareOrganigramNodePreview} from './preview/organigramNode-preview'
import {validateOrganigramMember} from './validation/organigram-members'
import {organigramParentFilter, validateOrganigramParent} from './validation/organigram-parent'

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
        'Eén korte regel over waarvoor je bij deze positie terechtkunt (bijv. "Post, verslagen, de vzw"). Wordt als "waarvoor"-regel getoond op de sleutelkaarten bovenaan /hulp. Leeg = geen regel.',
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
      name: 'pillar',
      title: 'Pijler',
      type: 'string',
      group: 'rol',
      description:
        'Onder welke pijler van het clubboek op /hulp deze positie valt. Zonder pijler verschijnt de positie onder "Overige functies".',
      options: {
        list: [
          {title: 'Bestuur', value: 'bestuur'},
          {title: 'Sportief', value: 'sportief'},
          {title: 'Jeugd: organisatie', value: 'jeugd-organisatie'},
          {title: 'Jeugd: opleiding', value: 'jeugd-opleiding'},
          {title: 'Club & werking', value: 'club'},
          {title: 'Integriteit', value: 'integriteit'},
        ],
      },
      validation: (Rule) =>
        Rule.required().warning(
          'Kies een pijler. Zonder pijler verschijnt deze positie onder "Overige functies" op /hulp.',
        ),
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
        'De hiërarchisch bovenliggende positie. Laat leeg voor een positie op het hoogste niveau (rootniveau). De positie zelf en alle posities onder haar worden niet aangeboden: een kringverwijzing laat de hele tak uit het organigram verdwijnen.',
      options: {filter: organigramParentFilter},
      validation: (Rule) => Rule.custom((ref, context) => validateOrganigramParent(ref as {_ref?: string} | undefined, context)),
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
          // Its own `Rule` instance, so `.warning()` actually governs it.
          validation: (Rule) =>
            Rule.warning().custom((ref, context) => validateOrganigramMember(ref as never, context)),
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
