import {defineField, defineType} from 'sanity'

const DEFAULT_RECIPIENT = 'info@kcvvelewijt.be'

const roleRecipient = (name: string, title: string, helper: string) =>
  defineField({
    name,
    title,
    type: 'string',
    group: 'ontvangers',
    initialValue: DEFAULT_RECIPIENT,
    description: helper,
    validation: (Rule) =>
      Rule.required()
        .email()
        .error(
          'Verplicht. Naar dit adres sturen we de melding van elke nieuwe interesse voor deze rol — een leeg of ongeldig adres betekent dat niemand de aanvraag te zien krijgt.',
        ),
  })

/**
 * Singleton: per-role recipient for membership-form admin notifications. The
 * BFF reads this (cached) when an application comes in and routes the notice to
 * the matching role address — all default to info@kcvvelewijt.be.
 */
export const formRoutingConfig = defineType({
  name: 'formRoutingConfig',
  title: 'Form routing config',
  type: 'document',
  // @ts-expect-error __experimental_actions is not in the public type yet
  __experimental_actions: ['update', 'publish'],
  groups: [{name: 'ontvangers', title: 'Ontvangers', default: true}],
  fields: [
    roleRecipient('speler', 'Speler', 'Ontvanger van interesse als senior speler.'),
    roleRecipient('jeugdspeler', 'Jeugdspeler', 'Ontvanger van interesse van jeugdspelers.'),
    roleRecipient('vrijwilliger', 'Vrijwilliger', 'Ontvanger van interesse van vrijwilligers.'),
    roleRecipient('trainer', 'Trainer', 'Ontvanger van interesse van trainers.'),
    roleRecipient('scheidsrechter', 'Scheidsrechter', 'Ontvanger van interesse van scheidsrechters.'),
  ],
  preview: {
    prepare() {
      return {title: 'Form routing config'}
    },
  },
})
