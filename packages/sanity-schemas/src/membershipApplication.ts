import {defineField, defineType} from 'sanity'

const ROLE_OPTIONS = [
  {title: 'Speler', value: 'speler'},
  {title: 'Jeugdspeler', value: 'jeugdspeler'},
  {title: 'Vrijwilliger', value: 'vrijwilliger'},
  {title: 'Trainer', value: 'trainer'},
  {title: 'Scheidsrechter', value: 'scheidsrechter'},
]

const STATUS_OPTIONS = [
  {title: 'Nieuw', value: 'new'},
  {title: 'Gecontacteerd', value: 'contacted'},
  {title: 'Goedgekeurd', value: 'approved'},
  {title: 'Afgewezen', value: 'rejected'},
]

/**
 * Membership-intake submission, created by the public `/club/word-lid` form via
 * the BFF (never by an editor). Submitted fields are read-only; editors manage
 * the `status` workflow and add internal `notes`.
 */
export const membershipApplication = defineType({
  name: 'membershipApplication',
  title: 'Inschrijving',
  type: 'document',
  groups: [
    {name: 'aanvraag', title: 'Aanvraag', default: true},
    {name: 'toestemming', title: 'Toestemming'},
    {name: 'beheer', title: 'Beheer'},
  ],
  fields: [
    defineField({
      name: 'role',
      title: 'Rol',
      type: 'string',
      group: 'aanvraag',
      readOnly: true,
      description:
        'De rol waarvoor deze persoon zich inschreef. Bepaalt naar welk e-mailadres de melding ging (zie Form routing config).',
      options: {list: ROLE_OPTIONS},
      validation: (Rule) =>
        Rule.required().error('Verplicht — wordt automatisch ingevuld door het formulier.'),
    }),
    defineField({
      name: 'firstName',
      title: 'Voornaam',
      type: 'string',
      group: 'aanvraag',
      readOnly: true,
      validation: (Rule) => Rule.required().error('Verplicht.'),
    }),
    defineField({
      name: 'lastName',
      title: 'Achternaam',
      type: 'string',
      group: 'aanvraag',
      readOnly: true,
      validation: (Rule) => Rule.required().error('Verplicht.'),
    }),
    defineField({
      name: 'birthDate',
      title: 'Geboortedatum',
      type: 'date',
      group: 'aanvraag',
      readOnly: true,
      options: {dateFormat: 'DD-MM-YYYY'},
      description: 'Volledige geboortedatum. Bepaalt of de aanvrager minderjarig is.',
      validation: (Rule) => Rule.required().error('Verplicht.'),
    }),
    defineField({
      name: 'isMinor',
      title: 'Minderjarig',
      type: 'boolean',
      group: 'aanvraag',
      readOnly: true,
      description:
        'Automatisch berekend uit de geboortedatum op het moment van inschrijven. Bij minderjarigen is een ouder/voogd-e-mail + toestemming vereist.',
    }),
    defineField({
      name: 'gender',
      title: 'Geslacht',
      type: 'string',
      group: 'aanvraag',
      readOnly: true,
      options: {
        list: [
          {title: 'Man', value: 'm'},
          {title: 'Vrouw', value: 'f'},
          {title: 'X', value: 'x'},
        ],
      },
      validation: (Rule) => Rule.required().error('Verplicht.'),
    }),
    defineField({
      name: 'municipality',
      title: 'Gemeente',
      type: 'string',
      group: 'aanvraag',
      readOnly: true,
      validation: (Rule) => Rule.required().error('Verplicht.'),
    }),
    defineField({
      name: 'email',
      title: 'E-mail',
      type: 'string',
      group: 'aanvraag',
      readOnly: true,
      description: 'Het e-mailadres van de aanvrager — gebruik dit om contact op te nemen.',
      validation: (Rule) => Rule.required().error('Verplicht.'),
    }),
    defineField({
      name: 'priorClub',
      title: 'Vorige club',
      type: 'string',
      group: 'aanvraag',
      readOnly: true,
      description: 'Optioneel opgegeven door de aanvrager.',
    }),
    defineField({
      name: 'parentEmail',
      title: 'Ouder/voogd e-mail',
      type: 'string',
      group: 'toestemming',
      readOnly: true,
      description: 'Enkel ingevuld bij minderjarigen. Kreeg ook een bevestigingsmail.',
    }),
    defineField({
      name: 'parentalConsent',
      title: 'Ouderlijke toestemming',
      type: 'boolean',
      group: 'toestemming',
      readOnly: true,
      description: 'De ouder/voogd bevestigde toestemming te geven voor deze inschrijving (minderjarigen).',
    }),
    defineField({
      name: 'medicalCertAcknowledged',
      title: 'Medisch attest erkend',
      type: 'boolean',
      group: 'toestemming',
      readOnly: true,
      description:
        'Speler/jeugdspeler bevestigde een medisch attest van geneeskundige geschiktheid te zullen voorleggen bij de eerste training.',
    }),
    defineField({
      name: 'privacyAccepted',
      title: 'Privacyverklaring aanvaard',
      type: 'boolean',
      group: 'toestemming',
      readOnly: true,
      description: 'De aanvrager aanvaardde de privacyverklaring bij het inschrijven.',
    }),
    defineField({
      name: 'submittedAt',
      title: 'Ingediend op',
      type: 'datetime',
      group: 'beheer',
      readOnly: true,
      description: 'Tijdstip waarop het formulier werd ingediend.',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'beheer',
      initialValue: 'new',
      options: {list: STATUS_OPTIONS, layout: 'radio'},
      description:
        'Beheer de opvolging: Nieuw → Gecontacteerd → Goedgekeurd/Afgewezen. Bepaalt onder welke filter deze inschrijving in de lijst verschijnt.',
      validation: (Rule) => Rule.required().error('Verplicht — kies een status zodat de inschrijving correct gefilterd wordt.'),
    }),
    defineField({
      name: 'notes',
      title: 'Notities',
      type: 'text',
      rows: 3,
      group: 'beheer',
      description: 'Interne notities voor de opvolging. Niet zichtbaar voor de aanvrager.',
    }),
  ],
  orderings: [
    {
      title: 'Nieuwste eerst',
      name: 'submittedAtDesc',
      by: [{field: 'submittedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      firstName: 'firstName',
      lastName: 'lastName',
      role: 'role',
      status: 'status',
    },
    prepare({firstName, lastName, role, status}) {
      const roleLabel = ROLE_OPTIONS.find((r) => r.value === role)?.title ?? role
      const statusLabel = STATUS_OPTIONS.find((s) => s.value === status)?.title ?? status
      return {
        title: `${firstName ?? ''} ${lastName ?? ''}`.trim() || '(naamloos)',
        subtitle: [roleLabel, statusLabel].filter(Boolean).join(' · '),
      }
    },
  },
})
