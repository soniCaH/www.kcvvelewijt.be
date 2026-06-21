import {defineField, defineType} from 'sanity'

export const sponsor = defineType({
  name: 'sponsor',
  title: 'Sponsor',
  type: 'document',
  // Editor-UX rework groups (#1506). `sponsor` is the default tab — the editor
  // fills in identity first, then how/where it shows, links, and SEO.
  groups: [
    {name: 'sponsor', title: 'Sponsor', default: true},
    {name: 'weergave', title: 'Tier & weergave'},
    {name: 'links', title: 'Links'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'sponsor',
      description:
        'De officiële naam van de sponsor zoals die zelf geschreven wordt (bijv. "Garage Janssens"). Wordt als bijschrift onder het logo en als alt-tekst getoond — zonder naam is de sponsor niet identificeerbaar.',
      validation: (r) =>
        r.required().error(
          'Verplicht. Zonder naam heeft het logo geen bijschrift of alt-tekst en is de sponsor niet identificeerbaar op de site.',
        ),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      group: 'sponsor',
      description:
        'Het logo van de sponsor, liefst met transparante achtergrond (PNG of SVG). Wordt in het sponsoroverzicht standaard in grijswaarden getoond en kleurt volledig in bij hover. Zonder logo valt de weergave terug op enkel de naam.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'tier',
      title: 'Tier',
      type: 'string',
      group: 'weergave',
      description:
        'Bepaalt waar en hoe prominent de sponsor verschijnt: "Hoofdsponsor" en "Sponsor" komen op de homepage, "Sympathisant" enkel op de sponsorpagina. Kies het niveau dat overeenkomt met het sponsorcontract.',
      options: {
        list: [
          {title: 'Hoofdsponsor', value: 'hoofdsponsor'},
          {title: 'Sponsor', value: 'sponsor'},
          {title: 'Sympathisant', value: 'sympathisant'},
        ],
      },
      validation: (r) =>
        r.warning(
          'Kies een sponsorniveau — zonder tier verschijnt de sponsor niet in de tier-gebaseerde secties (homepage en sponsoroverzicht).',
        ),
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      group: 'weergave',
      description:
        'Zet aan om deze sponsor uit te lichten in de spotlight-sectie op de homepage. Gebruik spaarzaam: meerdere uitgelichte sponsors verdelen de aandacht. Standaard uit.',
      initialValue: false,
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      group: 'weergave',
      description:
        'Laat aan om de sponsor zichtbaar te houden op de site. Zet uit om de sponsor tijdelijk te verbergen zonder hem te verwijderen — bijvoorbeeld wanneer een contract afloopt.',
      initialValue: true,
    }),
    defineField({
      name: 'description',
      title: 'Spotlight description',
      type: 'text',
      rows: 3,
      group: 'weergave',
      description:
        'Optionele tekst die in de spotlight-sectie naast het logo verschijnt (bijv. "Leverde de matchbal voor de wedstrijd van 12 april"). Enkel zichtbaar wanneer de sponsor uitgelicht is. Houd het bij één of twee zinnen.',
    }),
    defineField({
      name: 'type',
      title: 'Type (legacy)',
      type: 'string',
      group: 'weergave',
      description:
        'Legacy categorisatie uit de vorige site — verborgen en niet meer gerenderd. Behouden zodat historische data niet breekt; mag weg na een opschoonmigratie.',
      options: {
        list: [
          {title: 'Crossing', value: 'crossing'},
          {title: 'Training', value: 'training'},
          {title: 'White', value: 'white'},
          {title: 'Green', value: 'green'},
          {title: 'Panel', value: 'panel'},
          {title: 'Other', value: 'other'},
        ],
      },
      hidden: true,
    }),
    defineField({
      name: 'url',
      title: 'Website',
      type: 'url',
      group: 'links',
      description:
        'Optioneel: de website van de sponsor (bijv. "https://garagejanssens.be"). Maakt het logo klikbaar en opent in een nieuw tabblad. Laat leeg als de sponsor geen website heeft.',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'string',
      group: 'seo',
      description:
        'Optionele SEO-omschrijving voor de sponsordetailpagina (max. 160 tekens). Verschijnt in Google-zoekresultaten en bij het delen op sociale media. Laat leeg om terug te vallen op een automatische omschrijving.',
      validation: (r) => r.max(160),
    }),
    defineField({
      name: 'ogImage',
      title: 'OG image',
      type: 'image',
      group: 'seo',
      description:
        'Optionele afbeelding voor het delen op sociale media (Open Graph). Valt terug op het logo als dit leeg blijft. Gebruik bij voorkeur een liggende afbeelding van 1200×630 pixels.',
      options: {hotspot: true},
    }),
  ],
  preview: {
    select: {title: 'name', media: 'logo', tier: 'tier'},
    prepare({title, media, tier}) {
      return {title, subtitle: tier, media}
    },
  },
})
