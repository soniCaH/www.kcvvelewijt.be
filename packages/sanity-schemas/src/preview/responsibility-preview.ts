/**
 * Sanity preview select + prepare for responsibility.
 * Shows contact name (staffMember name or fallback role label) in subtitle.
 */

export const responsibilityPreviewSelect = {
  title: 'title',
  active: 'active',
  category: 'category',
  contactFirstName: 'primaryContact.staffMember->firstName',
  contactLastName: 'primaryContact.staffMember->lastName',
  contactRole: 'primaryContact.role',
}

interface ResponsibilityPreviewSelection {
  title?: string
  active?: boolean
  category?: string
  contactFirstName?: string
  contactLastName?: string
  contactRole?: string
}

export function prepareResponsibilityPreview(selection: ResponsibilityPreviewSelection) {
  const {title, active, category, contactFirstName, contactLastName, contactRole} = selection

  const contactName = [contactFirstName, contactLastName].filter(Boolean).join(' ')
  const contact = contactName || contactRole

  const parts = [category, contact, active === false ? 'inactief' : undefined].filter(Boolean)

  return {
    title: title ?? '(untitled)',
    subtitle: parts.join(' — '),
  }
}
