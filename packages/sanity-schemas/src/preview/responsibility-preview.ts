/**
 * Sanity preview select + prepare for responsibility.
 * Shows contact info (organigramNode title, team role, or manual role) in subtitle.
 */

export const responsibilityPreviewSelect = {
  title: 'title',
  active: 'active',
  category: 'category',
  contactNodeTitle: 'primaryContact.organigramNode->title',
  contactRole: 'primaryContact.role',
  contactType: 'primaryContact.contactType',
}

interface ResponsibilityPreviewSelection {
  title?: string
  active?: boolean
  category?: string
  contactNodeTitle?: string
  contactRole?: string
  contactType?: string
}

const contactLabel = (
  contactType: string | undefined,
  contactNodeTitle: string | undefined,
  contactRole: string | undefined,
): string | undefined => {
  switch (contactType) {
    case 'position':
      return contactNodeTitle
    case 'team-role':
      return 'Teamrol'
    case 'manual':
      return contactRole
    default:
      return undefined
  }
}

export const prepareResponsibilityPreview = (selection: ResponsibilityPreviewSelection) => {
  const {title, active, category, contactNodeTitle, contactRole, contactType} = selection

  const contact = contactLabel(contactType, contactNodeTitle, contactRole) || '(geen contact)'

  const parts = [category, contact, active === false ? 'inactief' : undefined].filter(Boolean)

  return {
    title: title ?? '(untitled)',
    subtitle: parts.join(' — '),
  }
};
