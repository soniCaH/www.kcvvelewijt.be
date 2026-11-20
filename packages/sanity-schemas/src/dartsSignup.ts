import {defineField, defineType} from 'sanity'
import {dartsSignupPreviewSelect, prepareDartsSignupPreview} from './preview/dartsSignup-preview'

/**
 * EK Darts team signup, created by the public `/darts` form via the BFF (#3812),
 * or by hand in the Studio for a team that signs up via-via.
 *
 * The number of free spots is never stored: it is the count of published
 * signups that are not on the wachtlijst, read at request time. Deleting a
 * signup frees its spot, adding one takes it. A freed spot does not move a
 * wachtlijst team up: that is done by hand (untick `Wachtlijst`).
 */
export const dartsSignup = defineType({
  name: 'dartsSignup',
  title: 'EK Darts inschrijving',
  type: 'document',
  groups: [
    {name: 'ploeg', title: 'Ploeg', default: true},
    {name: 'beheer', title: 'Beheer'},
  ],
  fields: [
    defineField({
      name: 'teamName',
      title: 'Ploegnaam',
      type: 'string',
      group: 'ploeg',
      description: 'Ook de mededeling bij de betaling.',
      validation: (Rule) => Rule.required().error('Verplicht.'),
    }),
    defineField({
      name: 'captainName',
      title: 'Naam kapitein',
      type: 'string',
      group: 'ploeg',
      validation: (Rule) => Rule.required().error('Verplicht.'),
    }),
    defineField({
      name: 'captainEmail',
      title: 'E-mail kapitein',
      type: 'string',
      group: 'ploeg',
      description: 'Alle mails van het EK gaan naar dit adres.',
      validation: (Rule) =>
        Rule.required().email().error('Verplicht: een geldig e-mailadres. De mails van het EK gaan hierheen.'),
    }),
    defineField({
      name: 'captainPhone',
      title: 'Gsm kapitein',
      type: 'string',
      group: 'ploeg',
      validation: (Rule) => Rule.required().error('Verplicht.'),
    }),
    defineField({
      name: 'remark',
      title: 'Opmerking',
      type: 'text',
      group: 'ploeg',
      description: 'Vrije opmerking van de ploeg, optioneel (max. 1000 tekens).',
    }),
    defineField({
      name: 'paid',
      title: 'Betaald',
      type: 'boolean',
      group: 'beheer',
      initialValue: false,
      description:
        'Zet dit aan zodra de betaling binnen is: dan vertrekt de bevestigingsmail met de uren van de dag, één keer.',
    }),
    defineField({
      name: 'waitlist',
      title: 'Wachtlijst',
      type: 'boolean',
      group: 'beheer',
      initialValue: false,
      description:
        'Aan = de ploeg telt niet mee voor de 24 plaatsen. Wordt er een plaats vrij, dan zet je dit zelf uit: er schuift niets automatisch op. Staat Betaald dan al aan, dan vertrekt de bevestigingsmail op het moment dat je dit uitzet (een ploeg op de wachtlijst krijgt die mail niet).',
    }),
    defineField({
      name: 'paidMailSentAt',
      title: 'Betaalmail verstuurd op',
      type: 'datetime',
      group: 'beheer',
      readOnly: true,
      description:
        'Ingevuld door de Sanity-webhook van de API (apps/api/src/webhooks/darts-paid-handler.ts) op het moment dat de bevestigingsmail na Betaald vertrok. Is dit ingevuld, dan gaat die mail nooit een tweede keer.',
    }),
    defineField({
      name: 'submittedAt',
      title: 'Ingediend op',
      type: 'datetime',
      group: 'beheer',
      readOnly: true,
      description: 'Ingevuld door de API (apps/api/src/handlers/darts.ts) op het moment dat de ploeg zich inschreef.',
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
    select: dartsSignupPreviewSelect,
    prepare: prepareDartsSignupPreview,
  },
})
