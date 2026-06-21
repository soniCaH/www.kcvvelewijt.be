import {defineField, defineType} from 'sanity'

const DEFAULT_RECIPIENT = 'info@kcvvelewijt.be'

const roleRecipient = (name: string, title: string, helper: string) =>
  defineField({
    name,
    title,
    type: 'string',
    initialValue: DEFAULT_RECIPIENT,
    description: helper,
    validation: (Rule) =>
      Rule.required()
        .email()
        .error('Vul een geldig e-mailadres in — hierheen gaan de meldingen van nieuwe inschrijvingen.'),
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
  fields: [
    roleRecipient('speler', 'Speler', 'Ontvanger van inschrijvingen als senior speler.'),
    roleRecipient('jeugdspeler', 'Jeugdspeler', 'Ontvanger van jeugd-inschrijvingen.'),
    roleRecipient('vrijwilliger', 'Vrijwilliger', 'Ontvanger van vrijwilligers-inschrijvingen.'),
    roleRecipient('trainer', 'Trainer', 'Ontvanger van trainer-inschrijvingen.'),
    roleRecipient('scheidsrechter', 'Scheidsrechter', 'Ontvanger van scheidsrechter-inschrijvingen.'),
  ],
  preview: {
    prepare() {
      return {title: 'Form routing config'}
    },
  },
})
