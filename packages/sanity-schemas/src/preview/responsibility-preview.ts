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

export function prepareResponsibilityPreview(selection: ResponsibilityPreviewSelection) {
  const {title, active, category, contactNodeTitle, contactRole, contactType} = selection

  const contact =
    (contactType === 'position'
      ? contactNodeTitle
      : contactType === 'team-role'
        ? 'Teamrol'
        : contactType === 'manual'
          ? contactRole
          : undefined) || '(geen contact)'

  const parts = [category, contact, active === false ? 'inactief' : undefined].filter(Boolean)

  return {
    title: title ?? '(untitled)',
    subtitle: parts.join(' — '),
  }
}
