import {defineField, defineType} from 'sanity'
import {editorialBioOf, PULLQUOTE_BIO_HELP} from './blocks/editorial-marks'

export const staffMember = defineType({
  name: 'staffMember',
  title: 'Staff member',
  type: 'document',
  // Editor-UX rework groups (#1505). `identiteit` is the default tab; the PSD-
  // synced read-only fields live under `meta`.
  groups: [
    {name: 'identiteit', title: 'Identiteit', default: true},
    {name: 'redactioneel', title: 'Redactioneel'},
    {name: 'meta', title: 'Meta'},
  ],
  fields: [
    defineField({
      name: 'firstName',
      title: 'First name',
      type: 'string',
      group: 'identiteit',
      description: 'De voornaam van het staflid, zoals getoond op de staf- en clubpagina\'s.',
      validation: (r) => r.required().error('Verplicht. Zonder voornaam heeft het profiel geen naam op de site.'),
    }),
    defineField({
      name: 'lastName',
      title: 'Last name',
      type: 'string',
      group: 'identiteit',
      description: 'De familienaam van het staflid, zoals getoond op de staf- en clubpagina\'s.',
      validation: (r) => r.required().error('Verplicht. Zonder familienaam heeft het profiel geen naam op de site.'),
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      group: 'identiteit',
      options: {hotspot: true},
      description: 'Portretfoto van het staflid, in kleur getoond. Zonder foto valt het profiel terug op de naam.',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      group: 'identiteit',
      description: 'Optioneel contact-e-mailadres. Wordt enkel getoond waar het staflid als contactpersoon is gekoppeld.',
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      group: 'identiteit',
      description: 'Optioneel telefoonnummer. Wordt enkel getoond waar het staflid als contactpersoon is gekoppeld.',
    }),
    defineField({
      name: 'birthDate',
      title: 'Birth date',
      type: 'date',
      group: 'identiteit',
      description: 'Geboortedatum (optioneel, niet publiek getoond — voor intern overzicht).',
    }),
    defineField({
      name: 'joinDate',
      title: 'Join date',
      type: 'date',
      group: 'identiteit',
      description: 'Datum waarop het staflid in functie kwam (optioneel, voor intern overzicht).',
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'array',
      group: 'redactioneel',
      // Parity with player.bio (STAFF-1/2): shared `editorialBioOf()` — same
      // pullquote decorator, same Normal-only lock. Renders via <BioBlock> on
      // the site, so the old default H2 ("act divider") no longer applies.
      of: editorialBioOf(),
      description: `Korte voorstelling van het staflid in vrije tekst. Getoond op het detailprofiel op de site. ${PULLQUOTE_BIO_HELP}`,
    }),
    defineField({
      name: 'functionTitle',
      title: 'Function title',
      type: 'string',
      group: 'meta',
      description:
        'Functietitel zoals gesynchroniseerd vanuit PSD (volledige waarde). Alleen-lezen — wordt door de sync beheerd, niet handmatig bewerken.',
      readOnly: true,
    }),
    defineField({
      name: 'psdId',
      title: 'PSD ID',
      type: 'string',
      group: 'meta',
      description:
        'Unieke identifier uit PSD (GET /teams/{id}/staff), gebruikt als publieke slug. Alleen-lezen — wordt door de sync beheerd, niet handmatig bewerken.',
      readOnly: true,
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      group: 'meta',
      description:
        'Automatisch gezet door de sync wanneer het lid niet meer in PSD voorkomt. Alleen-lezen — niet handmatig bewerken.',
      initialValue: false,
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
